from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from . import crud, models, schemas
from .database import get_db
from .dependencies import get_current_active_user
from .security import get_password_hash

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/register", response_model=schemas.UserRead)
async def register(user: schemas.UserCreate,db: AsyncSession = Depends(get_db)):
    existing = await crud.get_user_by_username(db, user.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed = get_password_hash(user.password)
    db_user = await crud.create_user(db, user, hashed)
    return db_user

@router.get("/me", response_model=schemas.UserRead)
async def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user


@router.get("/search", response_model=List[schemas.UserRead])
async def search_users(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user),
):
    return await crud.search_users(db, q, limit)
