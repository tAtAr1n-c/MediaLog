from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List

from . import models, schemas


def _to_model_media_type(media_type) -> models.MediaType:
    if isinstance(media_type, models.MediaType):
        return media_type
    value = getattr(media_type, "value", media_type)
    return models.MediaType(value)


async def get_user_by_username(db: AsyncSession, username: str) -> models.User | None:
    result = await db.execute(select(models.User).where(models.User.username == username))
    return result.scalar_one_or_none()


async def search_users(db: AsyncSession, query: str, limit: int = 20) -> List[models.User]:
    normalized_query = f"%{query.strip().removeprefix('@')}%"
    result = await db.execute(
        select(models.User)
        .where(
            or_(
                models.User.username.ilike(normalized_query),
                models.User.full_name.ilike(normalized_query),
            )
        )
        .order_by(models.User.username)
        .limit(limit)
    )
    return result.scalars().all()

async def create_user(db: AsyncSession, user: schemas.UserCreate, hashed_password: str) -> models.User:
    db_user = models.User(username=user.username, full_name=user.full_name, password_hash=hashed_password)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def create_review(db: AsyncSession, review: schemas.ReviewCreate, user_id: int) -> models.Review:
    review_data = review.model_dump()
    review_data["media_type"] = _to_model_media_type(review_data["media_type"])
    db_review = models.Review(**review_data, user_id=user_id)
    db.add(db_review)
    await db.commit()
    await db.refresh(db_review)
    return db_review

async def get_review(db: AsyncSession, review_id: int) -> models.Review | None:
    result = await db.execute(select(models.Review).where(models.Review.id == review_id))
    return result.scalar_one_or_none()

async def get_reviews(db: AsyncSession,user_id: Optional[int] = None,external_id: Optional[str] = None,media_type: Optional[models.MediaType] = None,skip: int = 0,limit: int = 100) -> List[models.Review]:
    query = select(models.Review)
    if user_id is not None:
        query = query.where(models.Review.user_id == user_id)
    if external_id is not None:
        query = query.where(models.Review.external_id == external_id)
    if media_type is not None:
        query = query.where(models.Review.media_type == _to_model_media_type(media_type))
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

async def update_review(db: AsyncSession, db_review: models.Review, update_data: schemas.ReviewUpdate) -> models.Review:
    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(db_review, field, value)
    await db.commit()
    await db.refresh(db_review)
    return db_review

async def delete_review(db: AsyncSession, db_review: models.Review) -> None:
    await db.delete(db_review)
    await db.commit()

async def create_user_content(db: AsyncSession, content: schemas.UserContentCreate, user_id: int) -> models.UserContent:
    content_data = content.model_dump()
    content_data["media_type"] = _to_model_media_type(content_data["media_type"])
    db_content = models.UserContent(**content_data, user_id=user_id)
    db.add(db_content)
    await db.commit()
    await db.refresh(db_content)
    return db_content

async def get_user_contents(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> List[models.UserContent]:
    result = await db.execute(
        select(models.UserContent)
        .where(models.UserContent.user_id == user_id)
        .offset(skip).limit(limit)
    )
    return result.scalars().all()

async def get_user_content(db: AsyncSession, content_id: int) -> models.UserContent | None:
    result = await db.execute(select(models.UserContent).where(models.UserContent.id == content_id))
    return result.scalar_one_or_none()


async def get_user_content_by_external(
    db: AsyncSession,
    user_id: int,
    external_id: str,
    media_type: schemas.MediaType,
) -> models.UserContent | None:
    result = await db.execute(
        select(models.UserContent).where(
            models.UserContent.user_id == user_id,
            models.UserContent.external_id == external_id,
            models.UserContent.media_type == _to_model_media_type(media_type),
        )
    )
    return result.scalar_one_or_none()


async def delete_user_content(db: AsyncSession, db_content: models.UserContent) -> None:
    await db.delete(db_content)
    await db.commit()
