import enum
from sqlalchemy import (
    Enum,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from db.models.base import BasesWithCreatedDate


class AccessLevel(enum.StrEnum):
    # can do whatever including delete/edit/add
    ADMIN = enum.auto()
    # only can change whats assigned to this user (no add/delete, only edit on what it has access to)
    ASSIGNED_ONLY = enum.auto()


class UserAccessLevel(BasesWithCreatedDate):
    __tablename__ = "user_access_level"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    project_user_association_id: Mapped[int] = mapped_column(
        ForeignKey("project_user_association.id", ondelete="CASCADE")
    )
    access_level: Mapped[AccessLevel] = mapped_column(
        Enum(AccessLevel, validate_strings=True)
    )

    __table_args__ = (UniqueConstraint("project_user_association_id", "access_level"),)
