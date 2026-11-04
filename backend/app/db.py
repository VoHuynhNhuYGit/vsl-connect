import os
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, sessionmaker


class Base(DeclarativeBase):
    pass


def get_database_url():
    url = os.environ.get('DATABASE_URL')
    if url:
        return url
    user = os.environ.get('MYSQL_USER')
    password = os.environ.get('MYSQL_PASSWORD')
    database = os.environ.get('MYSQL_DATABASE')
    host = os.environ.get('MYSQL_HOST')
    if all((user, password, database, host)):
        return URL.create('mysql+pymysql', username=user, password=password, host=host, port=3306, database=database, query={'charset': 'utf8mb4'})
    raise RuntimeError('DATABASE_URL chưa được thiết lập')


@lru_cache
def get_engine():
    return create_engine(get_database_url(), pool_pre_ping=True)


def get_db():
    with sessionmaker(bind=get_engine(), expire_on_commit=False)() as session:
        yield session
