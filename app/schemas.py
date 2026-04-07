from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from enum import Enum
from typing import Optional

class MediaType(str, Enum):
    MOVIE = "movie"
    BOOK = "book"

class UserCreate(BaseModel):
    username: str
    password: str

class UserRead(BaseModel):
    id: int
    username: str

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ReviewBase(BaseModel):
    external_id: str
    media_type: MediaType
    title: str
    rating: float = Field(ge=0, le=10)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    title: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=10)
    comment: Optional[str] = None

class ReviewRead(ReviewBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class UserContentCreate(BaseModel):
    external_id: str
    media_type: MediaType

class UserContentRead(BaseModel):
    id: int
    user_id: int
    external_id: str
    media_type: MediaType

    model_config = ConfigDict(from_attributes=True)