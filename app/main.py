from fastapi import FastAPI
from app.routers import users, auth, reviews, user_content
from app.database import engine, Base
import contextlib

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Review API", version="1.0", lifespan=lifespan)

app.include_router(users.router)
app.include_router(auth.router)
app.include_router(reviews.router)
app.include_router(user_content.router)

@app.get("/")
async def root():
    return {"message": "Review API is running"}