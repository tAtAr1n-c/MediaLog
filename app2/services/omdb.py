import os
import re
import httpx
from typing import List, Dict, Any
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


def _format_wikidata_movie(item: Dict[str, Any]) -> Dict[str, Any]:
    description = item.get("description") or ""
    year_match = YEAR_RE.search(description)

    return {
        "imdbID": f"wikidata-{item.get('id')}",
        "Title": item.get("label") or "Untitled movie",
        "Year": year_match.group(0) if year_match else None,
        "Type": "movie",
        "Poster": None,
    }


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
            seen_ids = set()

            for item in data.get("search", []):
                item_id = item.get("id")
                description = item.get("description") or ""

                if item_id in seen_ids or not FILM_DESCRIPTION_RE.search(description):
                    continue

                movies.append(_format_wikidata_movie(item))
                seen_ids.add(item_id)

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
