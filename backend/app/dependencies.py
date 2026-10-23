from typing import Annotated

from fastapi import Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db


def database_session():
    try:
        yield from get_db()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail='Cơ sở dữ liệu chưa được cấu hình.') from exc


Db = Annotated[Session, Depends(database_session)]
Limit = Annotated[int, Query(ge=1, le=100)]
Offset = Annotated[int, Query(ge=0)]
