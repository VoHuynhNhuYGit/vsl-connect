import json
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
import torch
from PIL import Image, ImageDraw, ImageFont
from torch import nn

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "best_model.pt"
LABEL_PATH = BASE_DIR / "models" / "label_map.json"

SEQUENCE_LENGTH = 60
KEYPOINT_SIZE = 126
CONFIDENCE_THRESHOLD = 0.85
MAX_MISSING_HAND_FRAMES = 8
CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720
WINDOW_NAME = "VSL Camera Test"
PREDICTIONS_WINDOW_NAME = "VSL Predictions"
PREDICTIONS_WINDOW_WIDTH = 500
PREDICTIONS_WINDOW_HEIGHT = 430
TOP_PREDICTION_COUNT = 6
FONT_PATHS = (
    Path(r"C:\Windows\Fonts\arial.ttf"),
    Path(r"C:\Windows\Fonts\segoeui.ttf"),
)
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class SignLanguageLSTM(nn.Module):
    """Architecture used by the PyTorch checkpoint in ``models/best_model.pt``."""

    def __init__(
        self,
        input_size: int,
        hidden_size: int,
        num_layers: int,
        num_classes: int,
    ) -> None:
        super().__init__()
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
        )
        # ``classifier.0`` has no parameters in the checkpoint. In evaluation
        # mode dropout is an identity operation, while keeping the checkpoint's
        # original ``classifier.1`` linear layer layout.
        self.classifier = nn.Sequential(
            nn.Dropout(p=0.3),
            nn.Linear(hidden_size, num_classes),
        )

    def forward(self, inputs: torch.Tensor) -> torch.Tensor:
        _, (hidden, _) = self.lstm(inputs)
        return self.classifier(hidden[-1])


def load_labels() -> list[str]:
    with LABEL_PATH.open("r", encoding="utf-8") as label_file:
        mapping = json.load(label_file)

    if isinstance(mapping, list):
        labels = mapping
    elif isinstance(mapping, dict):
        try:
            labels = [mapping[str(index)] for index in range(len(mapping))]
        except KeyError as error:
            raise ValueError(
                "label_map.json must use consecutive indexes from 0."
            ) from error
    else:
        raise ValueError("label_map.json must contain a JSON object or list.")

    if not all(isinstance(label, str) and label for label in labels):
        raise ValueError("label_map.json contains an invalid label.")

    return labels


def load_model(labels: list[str]) -> nn.Module:
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    checkpoint = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
    required_keys = {
        "model_state_dict",
        "labels",
        "input_size",
        "seq_len",
        "hidden_size",
        "num_layers",
    }
    missing_keys = required_keys - checkpoint.keys()
    if missing_keys:
        missing = ", ".join(sorted(missing_keys))
        raise ValueError(f"Model checkpoint is missing: {missing}")

    if checkpoint["input_size"] != KEYPOINT_SIZE:
        raise ValueError(
            f"Model input size must be {KEYPOINT_SIZE}, "
            f"not {checkpoint['input_size']}."
        )
    if checkpoint["seq_len"] != SEQUENCE_LENGTH:
        raise ValueError(
            f"Model sequence length must be {SEQUENCE_LENGTH}, "
            f"not {checkpoint['seq_len']}."
        )
    if checkpoint["labels"] != labels:
        raise ValueError("Labels in label_map.json do not match the checkpoint.")

    model = SignLanguageLSTM(
        input_size=checkpoint["input_size"],
        hidden_size=checkpoint["hidden_size"],
        num_layers=checkpoint["num_layers"],
        num_classes=len(labels),
    ).to(DEVICE)
    model.load_state_dict(checkpoint["model_state_dict"], strict=True)
    model.eval()
    return model


def extract_keypoints(results: object) -> np.ndarray:
    left = np.zeros(63, dtype=np.float32)
    right = np.zeros(63, dtype=np.float32)

    if results.multi_hand_landmarks:
        for hand, handedness in zip(
            results.multi_hand_landmarks,
            results.multi_handedness,
        ):
            points = np.array(
                [[point.x, point.y, point.z] for point in hand.landmark],
                dtype=np.float32,
            ).flatten()

            if handedness.classification[0].label == "Left":
                left = points
            else:
                right = points

    return np.concatenate([left, right])


def predict(model: nn.Module, sequence: list[np.ndarray]) -> np.ndarray:
    inputs = torch.from_numpy(np.asarray(sequence, dtype=np.float32))
    inputs = inputs.unsqueeze(0).to(DEVICE)

    with torch.inference_mode():
        probabilities = torch.softmax(model(inputs), dim=1)[0]

    return probabilities.cpu().numpy()


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for font_path in FONT_PATHS:
        if font_path.is_file():
            return ImageFont.truetype(str(font_path), size)
    return ImageFont.load_default()


def draw_camera_overlay(
    frame: np.ndarray,
    label: str,
    confidence: float,
    frame_count: int,
    title_font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    text_font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
) -> np.ndarray:
    image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    drawer = ImageDraw.Draw(image)
    drawer.rounded_rectangle((15, 15, 760, 145), radius=16, fill=(18, 24, 38))
    drawer.text((35, 30), f"Dự đoán: {label}", font=title_font, fill=(93, 255, 145))
    drawer.text(
        (35, 82),
        f"Độ tin cậy: {confidence:.2%}   |   Khung hình: {frame_count}/{SEQUENCE_LENGTH}",
        font=text_font,
        fill=(240, 244, 255),
    )
    return cv2.cvtColor(np.asarray(image), cv2.COLOR_RGB2BGR)


def create_predictions_panel(
    labels: list[str],
    predictions: list[tuple[int, float]],
    frame_count: int,
    title_font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
    text_font: ImageFont.FreeTypeFont | ImageFont.ImageFont,
) -> np.ndarray:
    panel = Image.new(
        "RGB",
        (PREDICTIONS_WINDOW_WIDTH, PREDICTIONS_WINDOW_HEIGHT),
        (18, 24, 38),
    )
    drawer = ImageDraw.Draw(panel)
    drawer.text((24, 18), "Dự đoán realtime", font=title_font, fill=(255, 255, 255))
    drawer.text(
        (24, 66),
        f"Đã thu thập: {frame_count}/{SEQUENCE_LENGTH} khung hình",
        font=text_font,
        fill=(174, 193, 220),
    )
    drawer.line((24, 105, PREDICTIONS_WINDOW_WIDTH - 24, 105), fill=(61, 76, 103))

    if not predictions:
        drawer.text(
            (24, 140),
            "Giữ tay trong khung để bắt đầu dự đoán.",
            font=text_font,
            fill=(255, 215, 105),
        )
    else:
        for rank, (index, score) in enumerate(predictions, start=1):
            top = 118 + (rank - 1) * 49
            color = (40, 73, 66) if rank == 1 else (30, 40, 58)
            drawer.rounded_rectangle(
                (16, top, PREDICTIONS_WINDOW_WIDTH - 16, top + 40),
                radius=8,
                fill=color,
            )
            drawer.text(
                (30, top + 8),
                f"{rank}. {labels[index]}",
                font=text_font,
                fill=(255, 255, 255),
            )
            score_text = f"{score:.2%}"
            score_x = PREDICTIONS_WINDOW_WIDTH - 30 - drawer.textlength(
                score_text,
                font=text_font,
            )
            drawer.text(
                (score_x, top + 8),
                score_text,
                font=text_font,
                fill=(93, 255, 145) if rank == 1 else (174, 193, 220),
            )

    return cv2.cvtColor(np.asarray(panel), cv2.COLOR_RGB2BGR)


def main() -> None:
    labels = load_labels()
    model = load_model(labels)
    mp_hands = mp.solutions.hands
    mp_draw = mp.solutions.drawing_utils
    sequence: list[np.ndarray] = []
    current_label = "Đang chờ"
    confidence = 0.0
    top_predictions: list[tuple[int, float]] = []
    missing_hand_frames = 0
    title_font = load_font(30)
    text_font = load_font(22)

    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
    if not cap.isOpened():
        cap.release()
        raise RuntimeError("Cannot open camera")

    try:
        cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(WINDOW_NAME, CAMERA_WIDTH, CAMERA_HEIGHT)
        cv2.namedWindow(PREDICTIONS_WINDOW_NAME, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(
            PREDICTIONS_WINDOW_NAME,
            PREDICTIONS_WINDOW_WIDTH,
            PREDICTIONS_WINDOW_HEIGHT,
        )

        with mp_hands.Hands(
            max_num_hands=2,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        ) as hands:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                frame = cv2.flip(frame, 1)
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = hands.process(rgb)

                if results.multi_hand_landmarks:
                    missing_hand_frames = 0
                    for hand in results.multi_hand_landmarks:
                        mp_draw.draw_landmarks(
                            frame,
                            hand,
                            mp_hands.HAND_CONNECTIONS,
                        )

                    sequence.append(extract_keypoints(results))
                    sequence = sequence[-SEQUENCE_LENGTH:]

                    if len(sequence) == SEQUENCE_LENGTH:
                        probabilities = predict(model, sequence)
                        indexes = np.argsort(probabilities)[::-1][
                            :TOP_PREDICTION_COUNT
                        ]
                        top_predictions = [
                            (int(index), float(probabilities[index]))
                            for index in indexes
                        ]
                        index, confidence = top_predictions[0]
                        current_label = (
                            labels[index]
                            if confidence >= CONFIDENCE_THRESHOLD
                            else f"Chưa chắc chắn: {labels[index]}"
                        )
                    else:
                        current_label = "Đang thu thập dữ liệu"
                        top_predictions = []
                else:
                    missing_hand_frames += 1
                    if missing_hand_frames > MAX_MISSING_HAND_FRAMES:
                        sequence.clear()
                        current_label = "Không thấy tay"
                        confidence = 0.0
                        top_predictions = []
                    else:
                        current_label = (
                            "Mất tay thoáng qua - đang giữ dữ liệu"
                        )

                frame = draw_camera_overlay(
                    frame,
                    current_label,
                    confidence,
                    len(sequence),
                    title_font,
                    text_font,
                )
                display_frame = cv2.resize(
                    frame,
                    (CAMERA_WIDTH, CAMERA_HEIGHT),
                    interpolation=cv2.INTER_LINEAR,
                )
                cv2.imshow(WINDOW_NAME, display_frame)
                cv2.imshow(
                    PREDICTIONS_WINDOW_NAME,
                    create_predictions_panel(
                        labels,
                        top_predictions,
                        len(sequence),
                        title_font,
                        text_font,
                    ),
                )

                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
