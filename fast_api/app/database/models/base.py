from sqlalchemy.orm import mapped_column, Mapped
from sqlalchemy.orm import DeclarativeBase
from datetime import datetime

class Base(DeclarativeBase):
    id: Mapped[int] = mapped_column(primary_key=True, index=True, nullable=False, autoincrement=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.now, nullable=False)
    modified_at: Mapped[datetime] = mapped_column(default=datetime.now, onupdate=datetime.now, nullable=False)
    __name__: str = "Base"