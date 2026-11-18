import json
import logging
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn

logger = logging.getLogger(__name__)


class GestureLSTM(nn.Module):
    def __init__(
        self,
        input_size: int = 126,
        hidden_size: int = 128,
        num_layers: int = 2,
        num_classes: int = 101,
        dropout: float = 0.2,
    ):
        super(GestureLSTM, self).__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.num_classes = num_classes

        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
        )
        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(hidden_size, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x shape: (batch_size, seq_len, input_size)
        out, _ = self.lstm(x)
        # Lấy hidden state ở time step cuối cùng
        last_step_out = out[:, -1, :]
        logits = self.classifier(last_step_out)
        return logits


class GestureClassifier:
    def __init__(self, model_dir: Path | None = None):
        self.device = torch.device("cpu")
        self.model_dir = model_dir or Path(__file__).resolve().parent

        # 1. Load Checkpoint & Xác định tham số kiến trúc
        model_path = self.model_dir / "best_model.pt"
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=True)
        state_dict = checkpoint.get("model_state_dict", checkpoint)
        classifier_weight = state_dict.get("classifier.1.weight")

        # Xác định linh hoạt input_size, hidden_size, num_layers, num_classes, seq_len từ checkpoint
        self.input_size = int(
            checkpoint.get("input_size")
            or (state_dict.get("lstm.weight_ih_l0").shape[1] if "lstm.weight_ih_l0" in state_dict else 126)
        )
        self.hidden_size = int(
            checkpoint.get("hidden_size")
            or (classifier_weight.shape[1] if classifier_weight is not None else 128)
        )
        self.seq_len = int(checkpoint.get("seq_len", 60))
        self.num_classes = int(
            classifier_weight.shape[0] if classifier_weight is not None else len(checkpoint.get("labels", [])) or 101
        )

        if "num_layers" in checkpoint:
            self.num_layers = int(checkpoint["num_layers"])
        else:
            layer_keys = [k for k in state_dict.keys() if k.startswith("lstm.weight_ih_l")]
            self.num_layers = len(layer_keys) if layer_keys else 2

        # 2. Load Label Map & Giải mã nhãn
        ckpt_labels = checkpoint.get("labels")
        labels_path = self.model_dir / "label_map.json"

        parsed_labels: dict[str, str] = {}
        if labels_path.exists():
            with labels_path.open("r", encoding="utf-8") as f:
                raw_labels = json.load(f)

            # Hỗ trợ cả 2 dạng: index -> label (hoặc list) hoặc label -> index
            if isinstance(raw_labels, list):
                parsed_labels = {str(i): str(lbl) for i, lbl in enumerate(raw_labels)}
            elif isinstance(raw_labels, dict) and raw_labels:
                first_k, first_v = next(iter(raw_labels.items()))
                if isinstance(first_v, int) or (isinstance(first_v, str) and first_v.isdigit() and not first_k.isdigit()):
                    parsed_labels = {str(v): str(k) for k, v in raw_labels.items()}
                else:
                    parsed_labels = {str(k): str(v) for k, v in raw_labels.items()}

        # Ưu tiên thứ tự chuẩn từ checkpoint (nếu có), hoặc từ parsed label map
        if ckpt_labels and isinstance(ckpt_labels, list) and len(ckpt_labels) == self.num_classes:
            self.labels = {str(i): str(lbl) for i, lbl in enumerate(ckpt_labels)}
        elif parsed_labels:
            self.labels = parsed_labels
        else:
            self.labels = {str(i): f"Sign_{i}" for i in range(self.num_classes)}

        # 3. Load Normalization params (xử lý an toàn std == 0)
        norm_path = self.model_dir / "normalization.npz"
        norm_data = np.load(norm_path)
        mean_arr = norm_data["mean"]
        std_arr = norm_data["std"]

        expected_feature_shape = (self.input_size,)
        if mean_arr.shape != expected_feature_shape or std_arr.shape != expected_feature_shape:
            raise ValueError(
                f"normalization.npz must contain mean/std shaped {expected_feature_shape}; "
                f"received mean={mean_arr.shape}, std={std_arr.shape}."
            )

        # Xử lý an toàn: thay thế NaN/Inf và các giá trị std <= 0 bằng 1.0 để tránh chia cho 0
        self.mean = np.where(np.isfinite(mean_arr), mean_arr, 0.0).astype(np.float32)
        self.std = np.where((std_arr > 0) & np.isfinite(std_arr), std_arr, 1.0).astype(np.float32)

        # 4. Khởi tạo Model và nạp state_dict (khớp 100% kích thước)
        self.model = GestureLSTM(
            input_size=self.input_size,
            hidden_size=self.hidden_size,
            num_layers=self.num_layers,
            num_classes=self.num_classes,
        )
        self.model.load_state_dict(state_dict)
        self.model.to(self.device)
        self.model.eval()

        logger.info(
            "Loaded gesture classifier: seq_len=%d input_size=%d hidden_size=%d layers=%d classes=%d",
            self.seq_len,
            self.input_size,
            self.hidden_size,
            self.num_layers,
            self.num_classes,
        )

    def preprocess(self, sequence: np.ndarray) -> torch.Tensor:
        """
        Chuẩn hóa chuỗi landmarks đầu vào (seq_len, input_size).
        Áp dụng công thức (X - mean) / (std + 1e-8) với chuẩn hóa theo từng slot bàn tay:
        - Slot 1 [0..62]  : Chuẩn hóa nếu có bàn tay (tổng tọa độ > 1e-3), ngược lại giữ NGUYÊN 0.0.
        - Slot 2 [63..125]: Chuẩn hóa nếu có bàn tay (tổng tọa độ > 1e-3), ngược lại giữ NGUYÊN 0.0.
        Loại bỏ hoàn toàn lỗi biến 0.0 thành ~ -4.92 làm bão hòa LSTM và kích hoạt sai nhãn #13 (Cho).
        """
        if sequence.shape != (self.seq_len, self.input_size) or not np.isfinite(sequence).all():
            raise ValueError(
                f"Sequence must be finite and match shape ({self.seq_len}, {self.input_size}), "
                f"received shape={sequence.shape}."
            )

        norm_sequence = np.zeros_like(sequence, dtype=np.float32)
        for t in range(self.seq_len):
            # Slot 1: Bàn tay 1 (0..62)
            if np.abs(sequence[t, :63]).sum() > 1e-3:
                norm_sequence[t, :63] = (sequence[t, :63] - self.mean[:63]) / (self.std[:63] + 1e-8)
            # Slot 2: Bàn tay 2 (63..125)
            if np.abs(sequence[t, 63:126]).sum() > 1e-3:
                norm_sequence[t, 63:126] = (sequence[t, 63:126] - self.mean[63:126]) / (self.std[63:126] + 1e-8)

        if not np.isfinite(norm_sequence).all():
            raise ValueError("Normalization produced non-finite values.")
        return torch.tensor(norm_sequence, dtype=torch.float32).unsqueeze(0).to(self.device)

    def predict(self, sequence: np.ndarray) -> dict:
        """
        Input: numpy array shape (seq_len, input_size)
        Output: dict gồm label_id, label_name, confidence
        """
        if sequence.shape != (self.seq_len, self.input_size):
            raise ValueError(
                f"Dữ liệu đầu vào cần shape ({self.seq_len}, {self.input_size}), "
                f"nhận được: {sequence.shape}"
            )

        tensor = self.preprocess(sequence)
        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1)
            confidence, predicted_idx = torch.max(probs, dim=1)
            topk_conf, topk_indices = torch.topk(probs, k=min(3, self.num_classes), dim=1)

        idx_str = str(predicted_idx.item())
        top3 = [
            {
                "label_id": str(i.item()),
                "label_name": self.labels.get(str(i.item()), "Không xác định"),
                "confidence": round(c.item(), 4),
            }
            for c, i in zip(topk_conf[0], topk_indices[0])
        ]

        return {
            "label_id": idx_str,
            "label_name": self.labels.get(idx_str, "Không xác định"),
            "confidence": round(confidence.item(), 4),
            "top3": top3,
        }


# Khởi tạo singleton dùng xuyên suốt app
classifier = GestureClassifier()
