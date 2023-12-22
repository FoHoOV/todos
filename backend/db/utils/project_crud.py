from exceptiongroup import catch
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from db.models import project_user_association
from db.models.project import Project
from db.models.project_user_association import ProjectUserAssociation
from db.models.tag import Tag
from db.models.todo_category_order import TodoCategoryOrder
from db.models.todo_category_project_association import TodoCategoryProjectAssociation
from db.models.todo_item import TodoItem
from db.models.todo_item_tag_association import TodoItemTagAssociation
from db.models.user import User
from db.models.user_access_level import AccessLevel, UserAccessLevel
from db.schemas.project import (
    ProjectAttachAssociation,
    ProjectCreate,
    ProjectDetachAssociation,
    ProjectRead,
    ProjectUpdate,
)
from sqlalchemy.orm import Session
from db.schemas.todo_category import TodoCategoryCreate
from error.exceptions import ErrorCode, UserFriendlyError
from db.models.todo_category import TodoCategory


def create(db: Session, project: ProjectCreate, user_id: int):
    if db.query(User).filter(User.id == user_id).count() == 0:
        raise UserFriendlyError(
            ErrorCode.USER_NOT_FOUND, "requested user doesn't exist"
        )

    db_item = Project(**project.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)

    try:
        association = ProjectUserAssociation(user_id=user_id, project_id=db_item.id)
        db.add(association)
        db.commit()
        db.refresh(association)

        access_level = UserAccessLevel(
            project_user_association_id=association.id, access_level=AccessLevel.ADMIN
        )
        db.add(access_level)

        db.commit()
    except:
        db.delete(db_item)
        db.commit()
        raise UserFriendlyError(
            ErrorCode.UNKNOWN_ERROR, "We couldn't create the project, please try again"
        )

    if project.create_from_default_template:
        add_default_template_categories(db, db_item.id, user_id)

    return db_item


def update(db: Session, project: ProjectUpdate, user_id: int):
    db_item = get_project(db, ProjectRead(project_id=project.project_id), user_id)

    db_item.title = project.title
    db_item.description = project.description

    db.commit()
    db.refresh(db_item)

    return db_item


def attach_to_user(db: Session, association: ProjectAttachAssociation, user_id: int):
    user = db.query(User).filter(User.username == association.username).first()
    if user is None:
        raise UserFriendlyError(
            ErrorCode.USER_NOT_FOUND, "requested user doesn't exist"
        )

    validate_project_belongs_to_user(
        db,
        association.project_id,
        user_id,
        user_id,
        True,
    )

    association_db_item = ProjectUserAssociation(
        user_id=user.id, project_id=association.project_id
    )

    try:
        db.add(association_db_item)
        db.commit()
        db.refresh(association_db_item)
        return association_db_item
    except IntegrityError:
        raise UserFriendlyError(
            ErrorCode.USER_ASSOCIATION_ALREADY_EXISTS,
            "this user already exists in this project's associations",
        )


def detach_from_user(db: Session, association: ProjectDetachAssociation, user_id: int):
    validate_project_belongs_to_user(
        db,
        association.project_id,
        user_id,
        user_id,
        True,
    )

    db.query(ProjectUserAssociation).filter(
        ProjectUserAssociation.project_id == association.project_id,
        ProjectUserAssociation.user_id == user_id,
    ).delete()

    if (
        db.query(ProjectUserAssociation)
        .filter(ProjectUserAssociation.project_id == association.project_id)
        .count()
        == 0
    ):
        delete_project(db, association.project_id)

    db.commit()


def delete_project(db: Session, project_id: int):
    # the validation that this project belongs to user is callers responsibility
    categories_with_one_or_less_bound_projects = (
        db.query(
            TodoCategoryProjectAssociation.category_id,
        )
        .group_by(TodoCategoryProjectAssociation.category_id)
        .having(func.count(TodoCategoryProjectAssociation.category_id) <= 1)
    )

    categories_with_deleting_project_id = (
        db.query(TodoCategoryProjectAssociation.category_id)
        .filter(
            TodoCategoryProjectAssociation.project_id == project_id,
            TodoCategoryProjectAssociation.category_id.in_(
                categories_with_one_or_less_bound_projects
            ),
        )
        .all()
    )
    db.query(TodoCategory).filter(
        TodoCategory.id.in_(
            [row.tuple()[0] for row in categories_with_deleting_project_id]
        )
    ).delete()

    db.query(Project).filter(Project.id == project_id).delete()

    db.commit()


def get_project(db: Session, project: ProjectRead, user_id: int):
    result = (
        db.query(Project)
        .filter(Project.id == project.project_id)
        .join(Project.users)
        .filter(User.id == user_id)
        .first()
    )

    if result is None:
        raise UserFriendlyError(
            ErrorCode.PROJECT_NOT_FOUND,
            "project doesn't exist or doesn't belong to current user",
        )

    return result


def get_projects(db: Session, user_id: int):
    result = (
        db.query(Project)
        .join(Project.users)
        .filter(User.id == user_id)
        .order_by(Project.id.asc())
        .all()
    )

    return result


def add_default_template_categories(db, project_id: int, user_id: int):
    from .todo_category_crud import create as create_category

    default_categories = [
        {"title": "Pending", "description": "⌚"},
        {"title": "Working on it", "description": "⚒️"},
        {"title": "Stuck", "description": "😡"},
        {"title": "Done", "description": "✅"},
    ]

    for category in default_categories:
        create_category(
            db,
            TodoCategoryCreate.model_validate({**category, "project_id": project_id}),
            user_id,
        )


def validate_project_belongs_to_user(
    db: Session,
    project_id: int,
    inquired_user_id: int,
    current_user_id: int,
    pass_current_user_validations: bool = False,
):
    if (
        not pass_current_user_validations
        and db.query(ProjectUserAssociation)
        .filter(
            ProjectUserAssociation.user_id == current_user_id,
            ProjectUserAssociation.project_id == project_id,
        )
        .count()
        == 0
    ):
        raise UserFriendlyError(
            ErrorCode.PROJECT_NOT_FOUND,
            "project doesn't exist or doesn't belong to current user",
        )

    if (
        db.query(ProjectUserAssociation)
        .filter(
            ProjectUserAssociation.user_id == inquired_user_id,
            ProjectUserAssociation.project_id == project_id,
        )
        .count()
        == 0
    ):
        raise UserFriendlyError(
            ErrorCode.PROJECT_NOT_FOUND,
            "project doesn't exist or doesn't belong to user",
        )
