import random
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app2 import models, schemas
from app2.services import omdb
from app2.services.books import search_books
from app2.config.database import get_db

router = APIRouter(prefix="/discover", tags=["discover"])

MOVIE_QUERIES = [
    "matrix",
    "star",
    "night",
    "love",
    "city",
    "king",
    "space",
    "dream",
    "dark",
    "life",
    "road",
    "time",
]

BOOK_QUERIES = [
    "fantasy",
    "history",
    "love",
    "space",
    "detective",
    "adventure",
    "science",
    "classic",
    "future",
    "art",
    "travel",
    "mystery",
]


def _book_result_from_item(item: dict) -> schemas.BookSearchResult:
    volume = item.get("volumeInfo", {})
    return schemas.BookSearchResult(
        id=item["id"],
        title=volume.get("title", "Без названия"),
        subtitle=volume.get("subtitle"),
        authors=volume.get("authors"),
        description=volume.get("description"),
        thumbnail=volume.get("imageLinks", {}).get("thumbnail"),
        published_date=volume.get("publishedDate"),
    )


@router.get("/weekly-best", response_model=List[schemas.WeeklyBestReview])
async def weekly_best(
    limit: int = Query(8, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
):
    week_ago = datetime.utcnow() - timedelta(days=7)
    result = await db.execute(
        select(models.Review, models.User)
        .join(models.User, models.Review.user_id == models.User.id)
        .where(models.Review.created_at >= week_ago)
        .order_by(models.Review.rating.desc(), models.Review.created_at.desc())
        .limit(limit)
    )

    return [
        schemas.WeeklyBestReview(
            id=review.id,
            user_id=review.user_id,
            external_id=review.external_id,
            media_type=review.media_type,
            title=review.title,
            creator=review.creator,
            year=review.year,
            rating=review.rating,
            summary=review.summary,
            body=review.body,
            comment=review.comment,
            tone=review.tone,
            created_at=review.created_at,
            author_username=user.username,
            author_name=user.full_name,
        )
        for review, user in result.all()
    ]


@router.get("/random-movie", response_model=schemas.OmdbMovieSearchResult)
async def random_movie():
    queries = random.sample(MOVIE_QUERIES, k=len(MOVIE_QUERIES))

    for query in queries:
        movies = await omdb.search_movies(query, page=random.randint(1, 2))
        if movies:
            return random.choice(movies)

    raise HTTPException(status_code=404, detail="Не удалось найти случайный фильм")


@router.get("/random-book", response_model=schemas.BookSearchResult)
async def random_book():
    queries = random.sample(BOOK_QUERIES, k=len(BOOK_QUERIES))

    for query in queries:
        data = await search_books(
            query,
            start_index=random.randint(0, 5) * 10,
            max_results=20,
        )
        items = data.get("items", [])
        if items:
            return _book_result_from_item(random.choice(items))

    raise HTTPException(status_code=404, detail="Не удалось найти случайную книгу")
