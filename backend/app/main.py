from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.admin import router as admin_router
from app.auth import router as auth_router
from app.google_auth import router as google_auth_router
from app.media import router as media_router
from app.db import get_db, get_engine
from app.models import Course, Lesson, Sign
from app.schemas import CourseOut, LessonOut, SignOut

app = FastAPI(title='VSL Connect API', version='0.1.0')
app.include_router(auth_router)
app.include_router(google_auth_router)
app.include_router(admin_router)
app.include_router(media_router)


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
