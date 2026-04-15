from sqlalchemy import String, Integer, BigInteger, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database.models.base import Base


class Popu(Base):
    __tablename__ = "dummy"

    id = None
    created_at = None
    modified_at = None

    subdistrict_code: Mapped[int] = mapped_column(Integer, primary_key=True)
    region_name: Mapped[str] = mapped_column(String(40), nullable=False)

    population_1951: Mapped[int] = mapped_column(BigInteger, nullable=False)
    population_1961: Mapped[int] = mapped_column(BigInteger, nullable=False)
    population_1971: Mapped[int] = mapped_column(BigInteger, nullable=False)
    population_1981: Mapped[int] = mapped_column(BigInteger, nullable=False)
    
