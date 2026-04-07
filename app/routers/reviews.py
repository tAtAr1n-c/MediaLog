from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app import crud, schemas, models

from app.dependencies import get_current_active_user

from app.database import get_db

router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("/", response_model=schemas.ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_review(review: schemas.ReviewCreate,db: AsyncSession = Depends(get_db),current_user: models.User = Depends(get_current_active_user)):
    return await crud.create_review(db, review, current_user.id)

@router.get("/", response_model=List[schemas.ReviewRead])
async def list_reviews(user_id: Optional[int] = Query(None),external_id: Optional[str] = Query(None),media_type: Optional[schemas.MediaType] = Query(None),skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    return await crud.get_reviews(db, user_id, external_id, media_type, skip, limit)

@router.get("/{review_id}", response_model=schemas.ReviewRead)
async def get_review(review_id: int, db: AsyncSession = Depends(get_db)):
    review = await crud.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review

@router.put("/{review_id}", response_model=schemas.ReviewRead)
async def update_review(review_id: int,update_data: schemas.ReviewUpdate,db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    review = await crud.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return await crud.update_review(db, review, update_data)

@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(review_id: int,db: AsyncSession = Depends(get_db),current_user: models.User = Depends(get_current_active_user)):
    review = await crud.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    await crud.delete_review(db, review)