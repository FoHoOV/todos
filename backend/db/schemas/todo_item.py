from dataclasses import dataclass
from enum import Enum
from fastapi import Query
from pydantic import BaseModel, model_validator

from db.schemas.base import NullableOrderedItem


class SearchTodoStatus(Enum):
    ALL = "all"
    DONE = "done"
    PENDING = "pending"


class TodoItemBase(BaseModel):
    title: str
    description: str
    is_done: bool
    category_id: int


class TodoItemCreate(TodoItemBase):
    pass


class TodoItemUpdateItem(TodoItemBase):
    id: int
    new_category_id: int | None = None
    title: str | None = None
    description: str | None = None
    is_done: bool | None = None


class TodoItemUpdateOrder(BaseModel):
    id: int
    left_id: int | None
    right_id: int | None
    new_category_id: int


class TodoItemDelete(BaseModel):
    id: int


@dataclass
class SearchTodoItemParams:
    project_id: int
    category_id: int
    status: SearchTodoStatus = Query(default=SearchTodoStatus.ALL)


class TodoItem(TodoItemBase):
    id: int
    order: NullableOrderedItem | None

    class Config:
        from_attributes = True
