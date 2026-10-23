"""Admin-only CRUD endpoints for learning content and user accounts."""

from typing import TypeVar

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from app.auth import AdminUser, AdminWriter
from app.dependencies import Db, Limit, Offset
from app.models import Course, Enrollment, Lesson, LessonProgress, LessonSign, Quiz, QuizAttempt, ReviewSchedule, Sign, User
from app.schemas import (
    AdminCourseOut,
    AdminLessonOut,
    AdminOverviewOut,
    AdminSignOut,
    CourseInput,
    LessonInput,
    SignInput,
    UserCreate,
    UserOut,
    UserUpdate,
)
from app.security import hash_password


router = APIRouter(prefix='/api/v1/admin', tags=['administration'])
Model = TypeVar('Model')


def get_or_404(db: Db, model_type: type[Model], item_id: int, label: str) -> Model:
    item = db.get(model_type, item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f'Không tìm thấy {label}.')
    return item


def commit_or_conflict(db: Db, detail: str):
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail=detail) from exc


@router.get('/overview', response_model=AdminOverviewOut)
def overview(db: Db, _admin: AdminUser):
    return AdminOverviewOut(
        courses=db.scalar(select(func.count()).select_from(Course)) or 0,
        lessons=db.scalar(select(func.count()).select_from(Lesson)) or 0,
        signs=db.scalar(select(func.count()).select_from(Sign)) or 0,
        users=db.scalar(select(func.count()).select_from(User)) or 0,
    )


@router.get('/courses', response_model=list[AdminCourseOut])
def list_courses(db: Db, _admin: AdminUser, limit: Limit = 50, offset: Offset = 0):
    return db.scalars(select(Course).order_by(Course.id.desc()).offset(offset).limit(limit)).all()


@router.get('/courses/{course_id}', response_model=AdminCourseOut)
def get_course(course_id: int, db: Db, _admin: AdminUser):
    return get_or_404(db, Course, course_id, 'khóa học')


@router.post('/courses', response_model=AdminCourseOut, status_code=201)
def create_course(payload: CourseInput, db: Db, _admin: AdminWriter):
    course = Course(**payload.model_dump())
    db.add(course)
    commit_or_conflict(db, 'Slug khóa học đã tồn tại.')
    db.refresh(course)
    return course


@router.put('/courses/{course_id}', response_model=AdminCourseOut)
def update_course(course_id: int, payload: CourseInput, db: Db, _admin: AdminWriter):
    course = get_or_404(db, Course, course_id, 'khóa học')
    for field, value in payload.model_dump().items():
        setattr(course, field, value)
    commit_or_conflict(db, 'Slug khóa học đã tồn tại.')
    db.refresh(course)
    return course


@router.delete('/courses/{course_id}', status_code=204)
def delete_course(course_id: int, db: Db, _admin: AdminWriter):
    course = get_or_404(db, Course, course_id, 'khóa học')
    if db.scalar(select(Lesson.id).where(Lesson.course_id == course.id).limit(1)):
        raise HTTPException(status_code=409, detail='Không thể xóa khóa học còn bài học.')
    if db.scalar(select(Enrollment.user_id).where(Enrollment.course_id == course.id).limit(1)):
        raise HTTPException(status_code=409, detail='Không thể xóa khóa học còn người học ghi danh.')
    db.delete(course)
    commit_or_conflict(db, 'Không thể xóa khóa học.')
    return Response(status_code=204)


@router.get('/lessons', response_model=list[AdminLessonOut])
def list_lessons(db: Db, _admin: AdminUser, course_id: int | None = None, limit: Limit = 50, offset: Offset = 0):
    statement = select(Lesson)
    if course_id is not None:
        statement = statement.where(Lesson.course_id == course_id)
    return db.scalars(statement.order_by(Lesson.course_id, Lesson.position).offset(offset).limit(limit)).all()


@router.get('/lessons/{lesson_id}', response_model=AdminLessonOut)
def get_lesson(lesson_id: int, db: Db, _admin: AdminUser):
    return get_or_404(db, Lesson, lesson_id, 'bài học')


@router.post('/lessons', response_model=AdminLessonOut, status_code=201)
def create_lesson(payload: LessonInput, db: Db, _admin: AdminWriter):
    get_or_404(db, Course, payload.course_id, 'khóa học')
    lesson = Lesson(**payload.model_dump())
    db.add(lesson)
    commit_or_conflict(db, 'Thứ tự bài học đã tồn tại trong khóa học này.')
    db.refresh(lesson)
    return lesson


@router.put('/lessons/{lesson_id}', response_model=AdminLessonOut)
def update_lesson(lesson_id: int, payload: LessonInput, db: Db, _admin: AdminWriter):
    get_or_404(db, Course, payload.course_id, 'khóa học')
    lesson = get_or_404(db, Lesson, lesson_id, 'bài học')
    for field, value in payload.model_dump().items():
        setattr(lesson, field, value)
    commit_or_conflict(db, 'Thứ tự bài học đã tồn tại trong khóa học này.')
    db.refresh(lesson)
    return lesson


@router.delete('/lessons/{lesson_id}', status_code=204)
def delete_lesson(lesson_id: int, db: Db, _admin: AdminWriter):
    lesson = get_or_404(db, Lesson, lesson_id, 'bài học')
    blockers = (
        db.scalar(select(LessonSign.lesson_id).where(LessonSign.lesson_id == lesson.id).limit(1))
        or db.scalar(select(LessonProgress.lesson_id).where(LessonProgress.lesson_id == lesson.id).limit(1))
        or db.scalar(select(Quiz.id).where(Quiz.lesson_id == lesson.id).limit(1))
    )
    if blockers:
        raise HTTPException(status_code=409, detail='Không thể xóa bài học đang có dữ liệu liên quan.')
    db.delete(lesson)
    commit_or_conflict(db, 'Không thể xóa bài học.')
    return Response(status_code=204)


@router.get('/signs', response_model=list[AdminSignOut])
def list_signs(db: Db, _admin: AdminUser, limit: Limit = 50, offset: Offset = 0):
    return db.scalars(select(Sign).order_by(Sign.id.desc()).offset(offset).limit(limit)).all()


@router.get('/signs/{sign_id}', response_model=AdminSignOut)
def get_sign(sign_id: int, db: Db, _admin: AdminUser):
    return get_or_404(db, Sign, sign_id, 'ký hiệu')


@router.post('/signs', response_model=AdminSignOut, status_code=201)
def create_sign(payload: SignInput, db: Db, _admin: AdminWriter):
    sign = Sign(**payload.model_dump())
    db.add(sign)
    commit_or_conflict(db, 'Không thể tạo ký hiệu.')
    db.refresh(sign)
    return sign


@router.put('/signs/{sign_id}', response_model=AdminSignOut)
def update_sign(sign_id: int, payload: SignInput, db: Db, _admin: AdminWriter):
    sign = get_or_404(db, Sign, sign_id, 'ký hiệu')
    for field, value in payload.model_dump().items():
        setattr(sign, field, value)
    commit_or_conflict(db, 'Không thể cập nhật ký hiệu.')
    db.refresh(sign)
    return sign


@router.delete('/signs/{sign_id}', status_code=204)
def delete_sign(sign_id: int, db: Db, _admin: AdminWriter):
    sign = get_or_404(db, Sign, sign_id, 'ký hiệu')
    if db.scalar(select(LessonSign.sign_id).where(LessonSign.sign_id == sign.id).limit(1)) or db.scalar(select(ReviewSchedule.sign_id).where(ReviewSchedule.sign_id == sign.id).limit(1)):
        raise HTTPException(status_code=409, detail='Không thể xóa ký hiệu đang có dữ liệu liên quan.')
    db.delete(sign)
    commit_or_conflict(db, 'Không thể xóa ký hiệu.')
    return Response(status_code=204)


@router.get('/users', response_model=list[UserOut])
def list_users(db: Db, _admin: AdminUser, limit: Limit = 50, offset: Offset = 0):
    return db.scalars(select(User).order_by(User.id.desc()).offset(offset).limit(limit)).all()


@router.get('/users/{user_id}', response_model=UserOut)
def get_user(user_id: int, db: Db, _admin: AdminUser):
    return get_or_404(db, User, user_id, 'người dùng')


@router.post('/users', response_model=UserOut, status_code=201)
def create_user(payload: UserCreate, db: Db, _admin: AdminWriter):
    user = User(
        email=payload.email,
        display_name=payload.display_name.strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    commit_or_conflict(db, 'Email này đã được sử dụng.')
    db.refresh(user)
    return user


@router.put('/users/{user_id}', response_model=UserOut)
def update_user(user_id: int, payload: UserUpdate, db: Db, _admin: AdminWriter):
    user = get_or_404(db, User, user_id, 'người dùng')
    if user.role == 'admin' and payload.role != 'admin' and _admin_count(db) <= 1:
        raise HTTPException(status_code=409, detail='Hệ thống phải luôn có ít nhất một quản trị viên.')
    user.display_name = payload.display_name.strip()
    user.role = payload.role
    if payload.password:
        user.password_hash = hash_password(payload.password)
    commit_or_conflict(db, 'Không thể cập nhật người dùng.')
    db.refresh(user)
    return user


@router.delete('/users/{user_id}', status_code=204)
def delete_user(user_id: int, db: Db, admin: AdminWriter):
    user = get_or_404(db, User, user_id, 'người dùng')
    if user.id == admin.id:
        raise HTTPException(status_code=409, detail='Bạn không thể tự xóa tài khoản quản trị đang dùng.')
    if user.role == 'admin' and _admin_count(db) <= 1:
        raise HTTPException(status_code=409, detail='Hệ thống phải luôn có ít nhất một quản trị viên.')
    blockers = (
        db.scalar(select(Enrollment.user_id).where(Enrollment.user_id == user.id).limit(1))
        or db.scalar(select(LessonProgress.user_id).where(LessonProgress.user_id == user.id).limit(1))
        or db.scalar(select(QuizAttempt.user_id).where(QuizAttempt.user_id == user.id).limit(1))
        or db.scalar(select(ReviewSchedule.user_id).where(ReviewSchedule.user_id == user.id).limit(1))
    )
    if blockers:
        raise HTTPException(status_code=409, detail='Không thể xóa người dùng đang có dữ liệu học tập.')
    db.delete(user)
    commit_or_conflict(db, 'Không thể xóa người dùng.')
    return Response(status_code=204)


def _admin_count(db: Db) -> int:
    return db.scalar(select(func.count()).select_from(User).where(User.role == 'admin')) or 0
