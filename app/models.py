from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Float, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class MediaType(str, enum.Enum):
    MOVIE = "movie"
    BOOK = "book"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    user_contents = relationship("UserContent", back_populates="user", cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    external_id = Column(String, nullable=False)  # ID из внешнего API
    media_type = Column(Enum(MediaType), nullable=False)
    title = Column(String, nullable=False)
    rating = Column(Float, nullable=False)  # например, 1-10
    comment = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reviews")

    __table_args__ = (
        Index("ix_reviews_user_external", "user_id", "external_id", "media_type", unique=False),
    )

class UserContent(Base):
    __tablename__ = "user_contents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    external_id = Column(String, nullable=False)
    media_type = Column(Enum(MediaType), nullable=False)

    user = relationship("User", back_populates="user_contents")

    __table_args__ = (
        Index("ix_user_contents_user_external", "user_id", "external_id", "media_type", unique=True),
    )