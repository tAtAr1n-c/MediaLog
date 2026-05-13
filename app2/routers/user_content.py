from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app2 import crud, models, schemas
from app2.config.database import get_db
from app2.dependencies import get_current_active_user

router = APIRouter(prefix="/user-content", tags=["user_content"])

@router.post("/", response_model=schemas.UserContentRead, status_code=status.HTTP_201_CREATED)
async def add_user_content(content: schemas.UserContentCreate,db: AsyncSession = Depends(get_db),current_user: models.User = Depends(get_current_active_user)):
    existing_content = await crud.get_user_content_by_external(
        db,
        current_user.id,
        content.external_id,
        content.media_type,
    )
    if existing_content:
        raise HTTPException(status_code=400, detail="Content already added")

    return await crud.create_user_content(db, content, current_user.id)

@router.get("/", response_model=List[schemas.UserContentRead])
async def list_user_content(skip: int = Query(0, ge=0),limit: int = Query(100, ge=1, le=100),db: AsyncSession = Depends(get_db),current_user: models.User = Depends(get_current_active_user)):
    return await crud.get_user_contents(db, current_user.id, skip, limit)

@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_user_content(content_id: int,db: AsyncSession = Depends(get_db),current_user: models.User = Depends(get_current_active_user)):
    content = await crud.get_user_content(db, content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    if content.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    await crud.delete_user_content(db, content)
