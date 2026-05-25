import os
import re
from urllib.parse import quote
import httpx
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

OMDB_API_KEY = os.getenv("OMDB_API_KEY")
OMDB_BASE_URL = "http://www.omdbapi.com/"
ITUNES_SEARCH_URL = "https://itunes.apple.com/search"
WIKIDATA_SEARCH_URL = "https://www.wikidata.org/w/api.php"
FILM_DESCRIPTION_RE = re.compile(r"\b(film|movie|фильм|кинофильм)\b", re.IGNORECASE)
YEAR_RE = re.compile(r"\b(18|19|20)\d{2}\b")


def _format_itunes_movie(movie: Dict[str, Any]) -> Dict[str, Any]:
    release_date = movie.get("releaseDate") or ""
    poster = movie.get("artworkUrl100") or ""

    return {
        "imdbID": f"itunes-{movie.get('trackId')}",
        "Title": movie.get("trackName") or movie.get("collectionName") or "Untitled movie",
        "Year": release_date[:4] if release_date else None,
        "Type": "movie",
        "Poster": poster.replace("100x100bb", "600x600bb") if poster else None,
    }


async def search_itunes_movies(query: str, page: int = 1) -> List[Dict[str, Any]]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            params = {
                "term": query,
                "media": "movie",
                "entity": "movie",
                "limit": 20,
                "offset": max(page - 1, 0) * 20,
            }

            response = await client.get(ITUNES_SEARCH_URL, params=params)
            response.raise_for_status()
            data = response.json()

            return [_format_itunes_movie(movie) for movie in data.get("results", [])]
    except Exception as e:
        print(f"Ошибка при поиске фильмов в iTunes: {e}")
        return []


def _commons_file_url(filename: str) -> str:
    return f"https://commons.wikimedia.org/wiki/Special:FilePath/{quote(filename)}?width=600"


def _format_wikidata_movie(item: Dict[str, Any], image_url: Optional[str] = None) -> Dict[str, Any]:
    description = item.get("description") or ""
    year_match = YEAR_RE.search(description)

    return {
        "imdbID": f"wikidata-{item.get('id')}",
        "Title": item.get("label") or "Untitled movie",
        "Year": year_match.group(0) if year_match else None,
        "Type": "movie",
        "Poster": image_url,
    }


async def get_wikidata_images(item_ids: List[str]) -> Dict[str, str]:
    if not item_ids:
        return {}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                WIKIDATA_SEARCH_URL,
                params={
                    "action": "wbgetentities",
                    "ids": "|".join(item_ids[:12]),
                    "props": "claims",
                    "format": "json",
                },
                headers={"User-Agent": "MediaLog/1.0"},
            )
            response.raise_for_status()
            data = response.json()

            images = {}
            for item_id, entity in data.get("entities", {}).items():
                image_claims = entity.get("claims", {}).get("P18", [])
                if not image_claims:
                    continue

                filename = (
                    image_claims[0]
                    .get("mainsnak", {})
                    .get("datavalue", {})
                    .get("value")
                )
                if filename:
                    images[item_id] = _commons_file_url(filename)

            return images
    except Exception as e:
        print(f"Ошибка при получении изображений из Wikidata: {e}")
        return {}


async def search_wikidata_movies(query: str) -> List[Dict[str, Any]]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            responses = await client.get(
                WIKIDATA_SEARCH_URL,
                params={
                    "action": "wbsearchentities",
                    "search": query,
                    "language": "en",
                    "format": "json",
                    "type": "item",
                    "limit": 30,
                },
                headers={"User-Agent": "MediaLog/1.0"},
            )
            responses.raise_for_status()
            data = responses.json()

            movies = []
            movie_items = []
            seen_ids = set()

            for item in data.get("search", []):
                item_id = item.get("id")
                description = item.get("description") or ""

                if item_id in seen_ids or not FILM_DESCRIPTION_RE.search(description):
                    continue

                movie_items.append(item)
                seen_ids.add(item_id)

            images = await get_wikidata_images([item.get("id") for item in movie_items])
            movies = [_format_wikidata_movie(item, images.get(item.get("id"))) for item in movie_items]

            return movies
    except Exception as e:
        print(f"Ошибка при поиске фильмов в Wikidata: {e}")
        return []


async def search_movies(query: str, page: int = 1) -> List[Dict[str, Any]]:
    if OMDB_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                params = {
                    "apikey": OMDB_API_KEY,
                    "s": query,
                    "page": page
                }

                response = await client.get(OMDB_BASE_URL, params=params)
                response.raise_for_status()
                data = response.json()

                if data.get("Response") == "False":
                    print(f"OMDB Error: {data.get('Error')}")
                else:
                    movies = data.get("Search", [])
                    if movies:
                        return movies
        except Exception as e:
            print(f"Ошибка при поиске фильмов в OMDB: {e}")

    itunes_movies = await search_itunes_movies(query, page)
    if itunes_movies:
        return itunes_movies

    return await search_wikidata_movies(query)


async def get_movie_details(movie_id: str) -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            params = {
                "apikey": OMDB_API_KEY,
                "i": movie_id,
                "plot": "full"
            }

            response = await client.get(OMDB_BASE_URL, params=params)
            response.raise_for_status()
            data = response.json()

            if data.get("Response") == "False":
                print(f"OMDB Error: {data.get('Error')}")
                return {}

            return data
    except Exception as e:
        print(f"Ошибка при получении деталей фильма {movie_id}: {e}")
        return {}
