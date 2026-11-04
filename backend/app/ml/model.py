import json
from pathlib import Path
import numpy as np
import torch
import torch.nn as nn

class GestureLSTM(nn.Module):
    def __init__(self, input_size=126, hidden_size=128, num_layers=2, num_classes=100, dropout=0.2):
        super(GestureLSTM, self).__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        self.classifier = nn.Sequential(
            nn.Dropout(dropout),
            nn.Linear(hidden_size, num_classes)
        )

    def forward(self, x):
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

        # 1. Load Normalization params
        norm_path = self.model_dir / "normalization.npz"
        norm_data = np.load(norm_path)
        self.mean = norm_data["mean"]
        self.std = norm_data["std"]

        # 2. Load Label Map
        labels_path = self.model_dir / "label_map.json"
        with labels_path.open("r", encoding="utf-8") as f:
            labels = json.load(f)
        self.labels = labels if isinstance(labels, dict) else {str(index): label for index, label in enumerate(labels)}

        # 3. Load Checkpoint & Khởi tạo Model
        model_path = self.model_dir / "best_model.pt"
        checkpoint = torch.load(model_path, map_location=self.device, weights_only=True)

        self.input_size = checkpoint.get("input_size", 126)
        self.hidden_size = checkpoint.get("hidden_size", 128)
        self.seq_len = checkpoint.get("seq_len", 60)
        self.num_layers = checkpoint.get("num_layers", 2)
        self.num_classes = len(self.labels)

        self.model = GestureLSTM(
            input_size=self.input_size,
            hidden_size=self.hidden_size,
            num_layers=self.num_layers,
            num_classes=self.num_classes
        )
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.to(self.device)
        self.model.eval()

    def preprocess(self, sequence: np.ndarray) -> torch.Tensor:
        """
        Chuẩn hóa chuỗi landmarks đầu vào (seq_len, 126)
        """
        # (X - mean) / (std + eps)
        norm_sequence = (sequence - self.mean) / (self.std + 1e-8)
        # Thêm batch dimension -> (1, 60, 126)
        tensor = torch.tensor(norm_sequence, dtype=torch.float32).unsqueeze(0)
        return tensor.to(self.device)

    def predict(self, sequence: np.ndarray):
        """
        Input: numpy array shape (60, 126)
        Output: dict gồm label_id, label_name, confidence
        """
        if sequence.shape != (self.seq_len, self.input_size):
            raise ValueError(f"Dữ liệu đầu vào cần shape ({self.seq_len}, {self.input_size}), nhận được: {sequence.shape}")

        tensor = self.preprocess(sequence)
        with torch.no_grad():
            logits = self.model(tensor)
            probs = torch.softmax(logits, dim=1)
            confidence, predicted_idx = torch.max(probs, dim=1)

        idx_str = str(predicted_idx.item())
        return {
            "label_id": idx_str,
            "label_name": self.labels.get(idx_str, "Không xác định"),
            "confidence": round(confidence.item(), 4)
        }

# Khởi tạo singleton dùng xuyên suốt app
classifier = GestureClassifier()
