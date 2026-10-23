from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CourseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    title: str
    description: str
    difficulty: str


class LessonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_id: int
    title: str
    description: str
    position: int
    video_url: str | None
    captions_url: str | None


class SignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    label: str
    topic: str
    region: str
    description: str
    video_url: str | None
    source: str | None


class CourseInput(BaseModel):
    slug: str = Field(min_length=3, max_length=160, pattern=r'^[a-z0-9]+(?:-[a-z0-9]+)*$')
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default='', max_length=10000)
    difficulty: str = Field(min_length=1, max_length=40)
    is_published: bool = False


class AdminCourseOut(CourseOut):
    is_published: bool
    created_at: datetime


class LessonInput(BaseModel):
    course_id: int = Field(gt=0)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default='', max_length=10000)
    position: int = Field(ge=1, le=1_000_000)
    video_url: str | None = Field(default=None, max_length=2048)
    captions_url: str | None = Field(default=None, max_length=2048)
    is_published: bool = False

    @field_validator('video_url', 'captions_url')
    @classmethod
    def validate_media_url(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        normalized = value.strip()
        if not (normalized.startswith('/') or normalized.startswith('https://') or normalized.startswith('http://')):
            raise ValueError('URL media must use http(s) or start with /.')
        return normalized


class AdminLessonOut(LessonOut):
    is_published: bool


class SignInput(BaseModel):
    label: str = Field(min_length=1, max_length=200)
    topic: str = Field(min_length=1, max_length=120)
    region: str = Field(min_length=1, max_length=120)
    description: str = Field(default='', max_length=10000)
    video_url: str | None = Field(default=None, max_length=2048)
    source: str | None = Field(default=None, max_length=500)
    is_published: bool = False

    @field_validator('video_url')
    @classmethod
    def validate_video_url(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        normalized = value.strip()
        if not (normalized.startswith('/') or normalized.startswith('https://') or normalized.startswith('http://')):
            raise ValueError('URL video must use http(s) or start with /.')
        return normalized


class AdminSignOut(SignOut):
    is_published: bool


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    display_name: str
    role: Literal['learner', 'admin']
    created_at: datetime


class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    display_name: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=12, max_length=128)
    role: Literal['learner', 'admin'] = 'learner'

    @field_validator('email')
    @classmethod
    def normalize_email(cls, value: str) -> str:
        normalized = value.strip().lower()
        local, separator, domain = normalized.partition('@')
        if not separator or not local or not domain or '.' not in domain:
            raise ValueError('Enter a valid email address.')
        return normalized


class UserUpdate(BaseModel):
    display_name: str = Field(min_length=1, max_length=120)
    role: Literal['learner', 'admin']
    password: str | None = Field(default=None, min_length=12, max_length=128)


class LoginInput(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class AuthSessionOut(BaseModel):
    user: UserOut
    csrf_token: str


class AdminOverviewOut(BaseModel):
    courses: int
    lessons: int
    signs: int
    users: int
