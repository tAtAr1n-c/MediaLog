from fastapi import APIRouter, HTTPException, Query
from typing import List

from app2.services import omdb
from app2.services.books import get_book_details, search_books
from app2.schemas import BookDetails, BookSearchResult, OmdbMovieDetails, OmdbMovieSearchResult

router = APIRouter(prefix="/media", tags=["media"])


@router.get("/movies/search", response_model=List[OmdbMovieSearchResult])
async def movies_search(
        query: str = Query(..., min_length=1),
    page: int = Query(1, ge=1)
):
    movies_data = await omdb.search_movies(query, page)
    if not movies_data:
        return []
    return movies_data


@router.get("/movies/{movie_id}", response_model=OmdbMovieDetails)
async def movie_details(movie_id: str):
    movie_data = await omdb.get_movie_details(movie_id)
    if not movie_data:
        raise HTTPException(status_code=404, detail="Фильм не найден")
    return movie_data


@router.get("/books/search", response_model=List[BookSearchResult])
async def books_search(
        query: str = Query(..., min_length=1),
        start_index: int = Query(0, ge=0),
        max_results: int = Query(20, ge=1, le=40)
):
    try:
        data = await search_books(query, start_index, max_results)
        items = data.get("items", [])

        result = []
        for item in items:
            vol = item.get("volumeInfo", {})
            result.append(BookSearchResult(
                id=item["id"],
                title=vol.get("title", ""),
                subtitle=vol.get("subtitle"),
                authors=vol.get("authors"),
                description=vol.get("description"),
                thumbnail=vol.get("imageLinks", {}).get("thumbnail"),
                published_date=vol.get("publishedDate")
            ))
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка Google Books: {str(e)}")


@router.get("/books/{volume_id}", response_model=BookDetails)
async def book_details(volume_id: str):
    try:
        data = await get_book_details(volume_id)
        vol = data.get("volumeInfo", {})

        return BookDetails(
            id=data["id"],
            title=vol.get("title", ""),
            subtitle=vol.get("subtitle"),
            authors=vol.get("authors"),
            description=vol.get("description"),
            thumbnail=vol.get("imageLinks", {}).get("thumbnail"),
            published_date=vol.get("publishedDate"),
            categories=vol.get("categories"),
            page_count=vol.get("pageCount"),
            language=vol.get("language"),
            preview_link=vol.get("previewLink")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка Google Books: {str(e)}")
