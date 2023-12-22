from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, relationship
from sqlalchemy.orm import mapped_column
from db.models.base import BasesWithCreatedDate
from db.models.user_access_level import UserAccessLevel


class ProjectUserAssociation(BasesWithCreatedDate):
    __tablename__ = "project_user_association"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    project_id: Mapped[int] = mapped_column(
        ForeignKey("project.id", ondelete="CASCADE")
    )

    access_levels: Mapped[list[UserAccessLevel]] = relationship(
        "UserAccessLevel",
        cascade="all, delete-orphan",
    )

    __table_args__ = (UniqueConstraint("user_id", "project_id"),)
