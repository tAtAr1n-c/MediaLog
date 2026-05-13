import contextlib
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import reviews
from .routers import auth, users, user_content, media, discover
from app2.config.database import Base, engine


async def ensure_user_created_at_column(conn):
    if conn.dialect.name != "sqlite":
        return

    result = await conn.exec_driver_sql("PRAGMA table_info(users)")
    column_names = {row[1] for row in result.fetchall()}

    if "created_at" in column_names:
        return

    await conn.exec_driver_sql("ALTER TABLE users ADD COLUMN created_at DATETIME")
    await conn.exec_driver_sql(
        """
        UPDATE users
        SET created_at = COALESCE(
            (SELECT MIN(created_at) FROM reviews WHERE reviews.user_id = users.id),
            (SELECT MIN(created_at) FROM user_contents WHERE user_contents.user_id = users.id),
            CURRENT_TIMESTAMP
        )
        WHERE created_at IS NULL
        """
    )


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await ensure_user_created_at_column(conn)
    yield


app = FastAPI(title="Review API", version="1.0", lifespan=lifespan)

frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(media.router)
app.include_router(discover.router)
app.include_router(users.router)
app.include_router(auth.router)
app.include_router(reviews.router)
app.include_router(user_content.router)

@app.get("/")
async def root():
    return {"message": "Review API is running"}
