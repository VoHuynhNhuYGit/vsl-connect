import json

from fastapi.testclient import TestClient

from app.main import app
from app.ml.model import classifier


def make_sequence(value: float = 0.0):
    return [[value] * classifier.input_size for _ in range(classifier.seq_len)]


def test_gesture_prediction_accepts_only_the_configured_tensor_shape():
    client = TestClient(app)
    valid = client.post("/api/v1/gesture/predict", json={"sequence": make_sequence()})

    assert valid.status_code == 200
    assert set(valid.json()) == {"label_id", "label_name", "confidence"}
    assert float(valid.headers["X-Gesture-Inference-Ms"]) >= 0

    wrong_shape = client.post("/api/v1/gesture/predict", json={"sequence": make_sequence()[:-1]})
    assert wrong_shape.status_code == 422


def test_gesture_prediction_rejects_non_finite_landmarks():
    client = TestClient(app)
    payload = json.dumps({"sequence": make_sequence()}).replace("0.0", "NaN", 1)

    response = client.post(
        "/api/v1/gesture/predict",
        content=payload,
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 422
    assert "NaN" in response.json()["detail"]
