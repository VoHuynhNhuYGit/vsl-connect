from datetime import datetime

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, false, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(20), server_default='learner')
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (CheckConstraint("role IN ('learner', 'admin')", name='ck_users_role'),)


class Course(Base):
    __tablename__ = 'courses'
    id: Mapped[int] = mapped_column(primary_key=True)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, server_default=text("('')"))
    difficulty: Mapped[str] = mapped_column(String(40))
    is_published: Mapped[bool] = mapped_column(Boolean, server_default=false(), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Lesson(Base):
    __tablename__ = 'lessons'
    id: Mapped[int] = mapped_column(primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey('courses.id', ondelete='RESTRICT'), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, server_default=text("('')"))
    position: Mapped[int] = mapped_column(Integer)
    video_url: Mapped[str | None] = mapped_column(String(2048))
    captions_url: Mapped[str | None] = mapped_column(String(2048))
    is_published: Mapped[bool] = mapped_column(Boolean, server_default=false())
    __table_args__ = (UniqueConstraint('course_id', 'position', name='uq_lesson_course_position'), CheckConstraint('position > 0', name='ck_lesson_position'))


class Sign(Base):
    __tablename__ = 'signs'
    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(200), index=True)
    topic: Mapped[str] = mapped_column(String(120), index=True)
    region: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(Text, server_default=text("('')"))
    video_url: Mapped[str | None] = mapped_column(String(2048))
    source: Mapped[str | None] = mapped_column(String(500))
    is_published: Mapped[bool] = mapped_column(Boolean, server_default=false(), index=True)


class LessonSign(Base):
    __tablename__ = 'lesson_signs'
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id', ondelete='RESTRICT'), primary_key=True)
    sign_id: Mapped[int] = mapped_column(ForeignKey('signs.id', ondelete='RESTRICT'), primary_key=True)
    position: Mapped[int] = mapped_column(Integer)
    __table_args__ = (UniqueConstraint('lesson_id', 'position', name='uq_lesson_sign_position'), CheckConstraint('position > 0', name='ck_lesson_sign_position'))


class Enrollment(Base):
    __tablename__ = 'enrollments'
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'), primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey('courses.id', ondelete='RESTRICT'), primary_key=True, index=True)
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LessonProgress(Base):
    __tablename__ = 'lesson_progress'
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'), primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id', ondelete='RESTRICT'), primary_key=True, index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Quiz(Base):
    __tablename__ = 'quizzes'
    id: Mapped[int] = mapped_column(primary_key=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('lessons.id', ondelete='RESTRICT'), index=True)
    title: Mapped[str] = mapped_column(String(200))
    is_published: Mapped[bool] = mapped_column(Boolean, server_default=false())


class QuizQuestion(Base):
    __tablename__ = 'quiz_questions'
    id: Mapped[int] = mapped_column(primary_key=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey('quizzes.id', ondelete='RESTRICT'), index=True)
    prompt: Mapped[str] = mapped_column(Text)
    position: Mapped[int] = mapped_column(Integer)
    __table_args__ = (UniqueConstraint('quiz_id', 'position', name='uq_quiz_question_position'), CheckConstraint('position > 0', name='ck_quiz_question_position'))


class QuizOption(Base):
    __tablename__ = 'quiz_options'
    id: Mapped[int] = mapped_column(primary_key=True)
    question_id: Mapped[int] = mapped_column(ForeignKey('quiz_questions.id', ondelete='RESTRICT'), index=True)
    text: Mapped[str] = mapped_column(Text)
    is_correct: Mapped[bool] = mapped_column(Boolean, server_default=false())


class QuizAttempt(Base):
    __tablename__ = 'quiz_attempts'
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'), index=True)
    quiz_id: Mapped[int] = mapped_column(ForeignKey('quizzes.id', ondelete='RESTRICT'), index=True)
    score: Mapped[int] = mapped_column(Integer)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    __table_args__ = (CheckConstraint('score >= 0 AND score <= 100', name='ck_quiz_attempt_score'),)


class ReviewSchedule(Base):
    __tablename__ = 'review_schedules'
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id', ondelete='RESTRICT'), primary_key=True)
    sign_id: Mapped[int] = mapped_column(ForeignKey('signs.id', ondelete='RESTRICT'), primary_key=True, index=True)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    interval_days: Mapped[int] = mapped_column(Integer, server_default='0')
    __table_args__ = (CheckConstraint('interval_days >= 0', name='ck_review_interval'),)
