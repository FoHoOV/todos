import builtins
from typing import Annotated
from fastapi import APIRouter, Depends, Response
from starlette.status import HTTP_200_OK
from sqlalchemy.orm import Session
from api.dependencies.db import get_db
from api.dependencies.oauth import get_current_user
from db.models.user import User
from db.schemas.project import (
    PartialUserWithPermission,
    Project,
    ProjectAttachAssociationResponse,
    ProjectCreate,
    ProjectDetachAssociation,
    ProjectRead,
    ProjectAttachAssociation,
    ProjectUpdate,
    ProjectUpdateUserPermissions,
)
from db.utils import project_crud


router = APIRouter(prefix="/project", tags=["project"])


@router.post("/create", response_model=Project)
def create_for_user(
    current_user: Annotated[User, Depends(get_current_user)],
    project: ProjectCreate,
    db: Session = Depends(get_db),
):
    return project_crud.create(db=db, project=project, user_id=current_user.id)


@router.patch(path="/update", response_model=Project)
def update(
    current_user: Annotated[User, Depends(get_current_user)],
    project: ProjectUpdate,
    db: Session = Depends(get_db),
):
    return project_crud.update(db, project, current_user.id)


@router.post(path="/attach-to-user", response_model=ProjectAttachAssociationResponse)
def attach_to_user(
    current_user: Annotated[User, Depends(get_current_user)],
    association: ProjectAttachAssociation,
    db: Session = Depends(get_db),
):
    return project_crud.attach_to_user(db, association, current_user.id)


@router.delete(path="/detach-from-user")
def detach_from_user(
    current_user: Annotated[User, Depends(get_current_user)],
    association: ProjectDetachAssociation,
    db: Session = Depends(get_db),
):
    project_crud.detach_from_user(db, association, current_user.id)
    return Response(status_code=HTTP_200_OK)


@router.patch(path="/update-user-permissions", response_model=PartialUserWithPermission)
def update_permissions(
    current_user: Annotated[User, Depends(get_current_user)],
    permissions: ProjectUpdateUserPermissions,
    db: Session = Depends(get_db),
):
    updated_project = project_crud.update_user_permissions(
        db, permissions, current_user.id
    )

    user = builtins.list(
        filter(
            lambda user: user.id == permissions.user_id,
            Project.model_validate(updated_project).users,
        )
    )[0]

    return user


@router.get("/search", response_model=Project)
def search(
    current_user: Annotated[User, Depends(get_current_user)],
    filter: ProjectRead = Depends(dependency=ProjectRead),
    db: Session = Depends(get_db),
):
    project = project_crud.get_project(db, filter, current_user.id)
    return project


@router.get("/list", response_model=list[Project])
def list(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    projects = project_crud.get_projects(db, current_user.id)
    return projects
