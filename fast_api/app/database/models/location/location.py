from sqlalchemy import String, Integer, BigInteger, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.database.models.base import Base


class Basic_state(Base):
    __tablename__ = "basic_basic_state"

    id = None
    created_at = None
    modified_at = None

    state_code: Mapped[int] = mapped_column(Integer, primary_key=True)
    state_name: Mapped[str] = mapped_column(String(40), nullable=False)


class Basic_district(Base):
    __tablename__ = "basic_basic_district"

    id = None
    created_at = None
    modified_at = None

    district_code: Mapped[int] = mapped_column(Integer, primary_key=True)
    district_name: Mapped[str] = mapped_column(String(40), nullable=False)

    state_code: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("basic_basic_state.state_code", ondelete="CASCADE"),
        nullable=False,
        index=True
    )


class Basic_subdistrict(Base):
    __tablename__ = "basic_basic_subdistrict"

    id = None
    created_at = None
    modified_at = None

    subdistrict_code: Mapped[int] = mapped_column(Integer, primary_key=True)
    subdistrict_name: Mapped[str] = mapped_column(String(40), nullable=False)

    district_code: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("basic_basic_district.district_code", ondelete="CASCADE"),
        nullable=False,
        index=True
    )


class Basic_village(Base):
    __tablename__ = "basic_basic_village"

    id = None
    created_at = None
    modified_at = None

    village_code: Mapped[int] = mapped_column(Integer, primary_key=True)
    village_name: Mapped[str] = mapped_column(String(100), nullable=False)
    population_2011: Mapped[int] = mapped_column(Integer, nullable=False)

    subdistrict_code: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("basic_basic_subdistrict.subdistrict_code", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
