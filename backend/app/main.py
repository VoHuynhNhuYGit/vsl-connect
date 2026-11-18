import re
from pathlib import Path
from typing import Annotated

import numpy as np
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.admin import router as admin_router
from app.auth import router as auth_router
from app.google_auth import router as google_auth_router
from app.gesture import router as gesture_router
from app.media import router as media_router
from app.profile import router as profile_router
from app.db import get_db, get_engine
from app.models import Course, Lesson, Sign
from app.schemas import CourseOut, LessonOut, SignOut

app = FastAPI(title='VSL Connect API', version='0.1.0')
app.include_router(auth_router)
app.include_router(google_auth_router)
app.include_router(admin_router)
app.include_router(media_router)
app.include_router(gesture_router)
app.include_router(profile_router)


def database_session():
    try:
        yield from get_db()
    except RuntimeError as exc:
        if str(exc) != 'DATABASE_URL chưa được thiết lập':
            raise
        raise HTTPException(status_code=503, detail='Cơ sở dữ liệu chưa được cấu hình.') from exc


Db = Annotated[Session, Depends(database_session)]
Limit = Annotated[int, Query(ge=1, le=100)]
Offset = Annotated[int, Query(ge=0)]


@app.exception_handler(SQLAlchemyError)
def database_error(_request, _exc):
    return JSONResponse(status_code=503, content={'detail': 'Không thể truy cập cơ sở dữ liệu.'})


@app.get('/health')
def health():
    return {'status': 'ok'}


@app.get('/health/ready')
def readiness():
    try:
        with get_engine().connect() as connection:
            connection.execute(text('SELECT 1'))
    except (SQLAlchemyError, RuntimeError):
        raise HTTPException(status_code=503, detail='Cơ sở dữ liệu chưa sẵn sàng.')
    return {'status': 'ok'}


@app.get('/api/v1/courses', response_model=list[CourseOut])
def list_courses(db: Db, limit: Limit = 20, offset: Offset = 0):
    statement = select(Course).where(Course.is_published.is_(True)).order_by(Course.id).offset(offset).limit(limit)
    return db.scalars(statement).all()


@app.get('/api/v1/courses/{slug}', response_model=CourseOut)
def get_course(slug: str, db: Db):
    course = db.scalar(select(Course).where(Course.slug == slug, Course.is_published.is_(True)))
    if not course:
        raise HTTPException(status_code=404, detail='Không tìm thấy khóa học.')
    return course


@app.get('/api/v1/courses/{slug}/lessons', response_model=list[LessonOut])
def list_lessons(slug: str, db: Db, limit: Limit = 20, offset: Offset = 0):
    course = db.scalar(select(Course).where(Course.slug == slug, Course.is_published.is_(True)))
    if not course:
        raise HTTPException(status_code=404, detail='Không tìm thấy khóa học.')
    statement = select(Lesson).where(Lesson.course_id == course.id, Lesson.is_published.is_(True)).order_by(Lesson.position).offset(offset).limit(limit)
    return db.scalars(statement).all()


@app.get('/api/v1/signs', response_model=list[SignOut])
def list_signs(db: Db, q: Annotated[str | None, Query(max_length=200)] = None, region: Annotated[str | None, Query(max_length=120)] = None, limit: Limit = 20, offset: Offset = 0):
    statement = select(Sign).where(Sign.is_published.is_(True))
    if q:
        statement = statement.where(Sign.label.icontains(q, autoescape=True))
    if region:
        statement = statement.where(Sign.region == region)
    return db.scalars(statement.order_by(Sign.id).offset(offset).limit(limit)).all()


@app.get('/api/v1/signs/{sign_id}', response_model=SignOut)
def get_sign(sign_id: int, db: Db):
    sign = db.scalar(select(Sign).where(Sign.id == sign_id, Sign.is_published.is_(True)))
    if not sign:
        raise HTTPException(status_code=404, detail='Không tìm thấy ký hiệu.')
    return sign


def parse_time_seconds(time_str: str) -> float:
    parts = time_str.strip().split(':')
    if len(parts) == 3:
        return float(parts[0]) * 3600 + float(parts[1]) * 60 + float(parts[2])
    elif len(parts) == 2:
        return float(parts[0]) * 60 + float(parts[1])
    return float(parts[0])


def resolve_keypoints_file(filename: str) -> Path | None:
    candidates = [
        Path('/app/seed_data/data/keypoints') / filename,
        Path(__file__).resolve().parent.parent / 'seed_data' / 'data' / 'keypoints' / filename,
        Path('backend/seed_data/data/keypoints') / filename,
        Path('seed_data/data/keypoints') / filename,
    ]
    for c in candidates:
        if c.is_file():
            return c
    return None


@app.get('/api/v1/lessons/{lesson_id}/keypoints')
@app.get('/api/lessons/{lesson_id}/keypoints')
def get_lesson_keypoints(lesson_id: int, db: Db, full: bool = False):
    lesson = db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise HTTPException(status_code=404, detail='Không tìm thấy bài học.')

    fn_match = re.search(r'(SENT\w+\.npy)', lesson.video_url or '') or re.search(r'(SENT\w+)', lesson.description or '')
    if not fn_match:
        raise HTTPException(status_code=404, detail='Bài học không có file tọa độ keypoints.')

    filename = fn_match.group(1)
    if not filename.endswith('.npy'):
        filename += '.npy'

    file_path = resolve_keypoints_file(filename)
    if not file_path:
        raise HTTPException(status_code=404, detail=f'Không tìm thấy file tọa độ {filename}.')

    try:
        data = np.load(file_path, mmap_mode='r')
    except Exception as exc:
        raise HTTPException(status_code=500, detail='Không thể đọc file keypoints.') from exc

    total_frames = int(data.shape[0])
    fps = 30.0

    time_match = re.search(r'Thời gian(?: minh họa)?:\s*([0-9:.]+)\s*(?:->|-)\s*([0-9:.]+)', lesson.description or '')

    if time_match and not full:
        start_ts = time_match.group(1)
        end_ts = time_match.group(2)
        try:
            start_sec = parse_time_seconds(start_ts)
            end_sec = parse_time_seconds(end_ts)
            start_frame = max(0, min(int(round(start_sec * fps)), total_frames - 1))
            end_frame = max(start_frame + 1, min(int(round(end_sec * fps)), total_frames))
        except (ValueError, IndexError):
            start_frame = 0
            end_frame = total_frames
            start_ts = "00:00:00.000"
            end_ts = f"00:00:{total_frames / fps:06.3f}"
    else:
        start_frame = 0
        end_frame = total_frames
        start_ts = "00:00:00.000"
        end_ts = f"00:00:{total_frames / fps:06.3f}"

    sliced = data[start_frame:end_frame]
    num_frames = int(sliced.shape[0])

    frames_json = []
    for frame in sliced:
        body = [[round(float(frame[i * 3]), 4), round(float(frame[i * 3 + 1]), 4), round(float(frame[i * 3 + 2]), 4)] for i in range(25)]
        face = [[round(float(frame[75 + i * 3]), 4), round(float(frame[75 + i * 3 + 1]), 4), round(float(frame[75 + i * 3 + 2]), 4)] for i in range(70)]
        left_hand = [[round(float(frame[285 + i * 3]), 4), round(float(frame[285 + i * 3 + 1]), 4), round(float(frame[285 + i * 3 + 2]), 4)] for i in range(21)]
        right_hand = [[round(float(frame[348 + i * 3]), 4), round(float(frame[348 + i * 3 + 1]), 4), round(float(frame[348 + i * 3 + 2]), 4)] for i in range(21)]

        frames_json.append({
            "body": body,
            "face": face,
            "left_hand": left_hand,
            "right_hand": right_hand,
        })

    return {
        "lesson_id": lesson.id,
        "title": lesson.title,
        "fps": int(fps),
        "start_time": start_ts,
        "end_time": end_ts,
        "start_frame": start_frame,
        "end_frame": end_frame,
        "total_video_frames": total_frames,
        "num_frames": num_frames,
        "keypoint_format": {
            "body_count": 25,
            "face_count": 70,
            "left_hand_count": 21,
            "right_hand_count": 21
        },
        "frames": frames_json,
    }
