from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from enum import Enum
from typing import Optional, List, Dict, Any


class MediaType(str, Enum):
    MOVIE = "movie"
    BOOK = "book"

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: Optional[str] = None

class UserRead(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    created_at: datetime

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
    creator: Optional[str] = None
    year: Optional[str] = None
    rating: float = Field(ge=0, le=10)
    summary: Optional[str] = None
    body: Optional[str] = None
    comment: Optional[str] = None
    tone: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    title: Optional[str] = None
    creator: Optional[str] = None
    year: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=10)
    summary: Optional[str] = None
    body: Optional[str] = None
    comment: Optional[str] = None
    tone: Optional[str] = None

class ReviewRead(ReviewBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WeeklyBestReview(ReviewRead):
    author_username: str
    author_name: Optional[str] = None

class UserContentCreate(BaseModel):
    external_id: str
    media_type: MediaType
    title: Optional[str] = None
    creator: Optional[str] = None
    year: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0, le=10)
    genre: Optional[str] = None
    status: Optional[str] = None
    note: Optional[str] = None
    tone: Optional[str] = None

class UserContentRead(BaseModel):
    id: int
    user_id: int
    external_id: str
    media_type: MediaType
    title: Optional[str] = None
    creator: Optional[str] = None
    year: Optional[str] = None
    rating: Optional[float] = None
    genre: Optional[str] = None
    status: Optional[str] = None
    note: Optional[str] = None
    tone: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class OmdbMovieSearchResult(BaseModel):
    imdbID: str
    Title: str
    Year: Optional[str] = None
    Type: str
    Poster: Optional[str] = None

class OmdbMovieDetails(OmdbMovieSearchResult):
    Rated: Optional[str] = None
    Released: Optional[str] = None
    Runtime: Optional[str] = None
    Genre: Optional[str] = None
    Director: Optional[str] = None
    Writer: Optional[str] = None
    Actors: Optional[str] = None
    Plot: Optional[str] = None
    Language: Optional[str] = None
    Country: Optional[str] = None
    Awards: Optional[str] = None
    Ratings: Optional[List[dict]] = None
    Metascore: Optional[str] = None
    imdbRating: Optional[str] = None
    imdbVotes: Optional[str] = None
    DVD: Optional[str] = None
    BoxOffice: Optional[str] = None
    Production: Optional[str] = None
    Website: Optional[str] = None

class BookSearchResult(BaseModel):
    id: str  # volumeId
    title: str
    subtitle: Optional[str] = None
    authors: Optional[List[str]] = None
    description: Optional[str] = None
    thumbnail: Optional[str] = None
    published_date: Optional[str] = None

class BookDetails(BookSearchResult):
    categories: Optional[List[str]] = None
    page_count: Optional[int] = None
    language: Optional[str] = None
    preview_link: Optional[str] = None
