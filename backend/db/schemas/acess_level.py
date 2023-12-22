from pydantic import BaseModel
from db.models.user_access_level import AccessLevel as AccessLevelEnum


class AccessLevel(BaseModel):
    access_level: AccessLevelEnum
