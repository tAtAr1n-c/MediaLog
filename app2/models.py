from datetime import datetime

from sqlalchemy import Column, Integer, String, ForeignKey, Enum, Float, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app2.config.database import Base

class MediaType(str, enum.Enum):
    MOVIE = "movie"
    BOOK = "book"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, server_default=func.now())

    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    user_contents = relationship("UserContent", back_populates="user", cascade="all, delete-orphan")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    external_id = Column(String, nullable=False)  # ID из внешнего API
    media_type = Column(Enum(MediaType), nullable=False)
    title = Column(String, nullable=False)
    creator = Column(String, nullable=True)
    year = Column(String, nullable=True)
    rating = Column(Float, nullable=False)  # например, 1-10
    summary = Column(String, nullable=True)
    body = Column(String, nullable=True)
    comment = Column(String, nullable=True)
    tone = Column(String, nullable=True)
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
    title = Column(String, nullable=True)
    creator = Column(String, nullable=True)
    year = Column(String, nullable=True)
    rating = Column(Float, nullable=True)
    genre = Column(String, nullable=True)
    status = Column(String, nullable=True)
    note = Column(String, nullable=True)
    tone = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="user_contents")

    __table_args__ = (
        Index("ix_user_contents_user_external", "user_id", "external_id", "media_type", unique=True),
    )
