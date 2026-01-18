from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/uibackend"
    SECRET_KEY: str = "supersecretkey"
    FRONTEND_URL: str = "http://localhost:5173"
    FIREBASE_SERVICE_ACCOUNT_PATH: str = "firebase-service-account.json"
    
    # Firebase Creds from Env
    FIREBASE_TYPE: str | None = None
    FIREBASE_PROJECT_ID: str | None = None
    FIREBASE_PRIVATE_KEY_ID: str | None = None
    FIREBASE_PRIVATE_KEY: str | None = None
    FIREBASE_CLIENT_EMAIL: str | None = None
    FIREBASE_CLIENT_ID: str | None = None
    FIREBASE_AUTH_URI: str | None = None
    FIREBASE_TOKEN_URI: str | None = None
    FIREBASE_AUTH_PROVIDER_X509_CERT_URL: str | None = None
    FIREBASE_CLIENT_X509_CERT_URL: str | None = None
    FIREBASE_UNIVERSE_DOMAIN: str | None = None
    class Config:
        env_file = ".env"

settings = Settings()

engine = create_async_engine(settings.DATABASE_URL, echo=True)

SessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with SessionLocal() as session:
        yield session
