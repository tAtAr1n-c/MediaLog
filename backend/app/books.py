from __future__ import annotations

import os
from typing import Any, Dict, List

import httpx

GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1"
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY")
OPEN_LIBRARY_SEARCH_URL = "https://openlibrary.org/search.json"


def _open_library_id(key: str) -> str:
    return f"openlibrary-{key.replace('/', '__')}"


def _open_library_key(volume_id: str) -> str:
    return volume_id.removeprefix("openlibrary-").replace("__", "/")


def _first_text(value: Any) -> str | None:
    if isinstance(value, list) and value:
        return str(value[0])
    if isinstance(value, str):
        return value
    return None


def _open_library_items(docs: List[Dict[str, Any]]) -> Dict[str, Any]:
    items = []

    for doc in docs:
        key = doc.get("key")
        if not key:
            continue

        cover_id = doc.get("cover_i")
        thumbnail = f"https://covers.openlibrary.org/b/id/{cover_id}-M.jpg" if cover_id else None
        first_publish_year = doc.get("first_publish_year")

        items.append(
            {
                "id": _open_library_id(key),
                "volumeInfo": {
                    "title": doc.get("title") or "Без названия",
                    "authors": doc.get("author_name"),
                    "description": _first_text(doc.get("first_sentence")),
                    "imageLinks": {"thumbnail": thumbnail} if thumbnail else {},
                    "publishedDate": str(first_publish_year) if first_publish_year else None,
                    "categories": doc.get("subject", [])[:5] if doc.get("subject") else None,
                    "pageCount": doc.get("number_of_pages_median"),
                    "language": _first_text(doc.get("language")),
                    "previewLink": f"https://openlibrary.org{key}",
                },
            }
        )

    return {"items": items}


async def search_open_library(query: str, start_index: int = 0, max_results: int = 20) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            OPEN_LIBRARY_SEARCH_URL,
            params={
                "q": query,
                "offset": start_index,
                "limit": max_results,
                "fields": "key,title,author_name,first_publish_year,cover_i,first_sentence,subject,number_of_pages_median,language",
            },
            headers={"User-Agent": "MediaLog/1.0"},
        )
        response.raise_for_status()
        data = response.json()
        return _open_library_items(data.get("docs", []))


async def search_google_books(query: str, start_index: int = 0, max_results: int = 20) -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        params = {
            "q": query,
            "startIndex": start_index,
            "maxResults": max_results,
        }
        if GOOGLE_BOOKS_API_KEY:
            params["key"] = GOOGLE_BOOKS_API_KEY

        headers = {
            "User-Agent": "ReviewAPI/1.0"
        }

        response = await client.get(
            f"{GOOGLE_BOOKS_BASE_URL}/volumes",
            params=params,
            headers=headers
        )
        response.raise_for_status()
        return response.json()


async def search_books(query: str, start_index: int = 0, max_results: int = 20) -> Dict[str, Any]:
    if not GOOGLE_BOOKS_API_KEY:
        return await search_open_library(query, start_index, max_results)

    try:
        return await search_google_books(query, start_index, max_results)
    except Exception as e:
        print(f"Google Books недоступен, используется Open Library: {e}")
        return await search_open_library(query, start_index, max_results)


async def get_book_details(volume_id: str) -> Dict[str, Any]:
    """Получение деталей книги по volume_id"""
    if volume_id.startswith("openlibrary-"):
        key = _open_library_key(volume_id)
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"https://openlibrary.org{key}.json",
                headers={"User-Agent": "MediaLog/1.0"},
            )
            response.raise_for_status()
            data = response.json()
            description = data.get("description")
            if isinstance(description, dict):
                description = description.get("value")

            return {
                "id": volume_id,
                "volumeInfo": {
                    "title": data.get("title") or "Без названия",
                    "description": description,
                    "publishedDate": _first_text(data.get("publish_date")),
                    "previewLink": f"https://openlibrary.org{key}",
                },
            }

    async with httpx.AsyncClient(timeout=10.0) as client:
        headers = {
            "User-Agent": "ReviewAPI/1.0"
        }
        params = {"key": GOOGLE_BOOKS_API_KEY} if GOOGLE_BOOKS_API_KEY else None

        response = await client.get(
            f"{GOOGLE_BOOKS_BASE_URL}/volumes/{volume_id}",
            headers=headers,
            params=params,
        )
        response.raise_for_status()
        return response.json()
