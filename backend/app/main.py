from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import workflows
from app.core.database import engine, Base
import os

app = FastAPI(title="Visual Backend Platform API")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000",], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(workflows.router, prefix="/api/v1/workflows", tags=["Workflows"])
from app.api.v1 import dashboard
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["Dashboard"])
from app.api.v1 import invoke
app.include_router(invoke.router, prefix="/api/v1/invoke", tags=["Invocation"])

@app.get("/")
async def root():
    return {"message": "Visual Backend Platform API is running"}

# Startup event to create tables (for dev only - use Alembic for prod)
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # Create tables if they don't exist. Removed drop_all to persist data.
        await conn.run_sync(Base.metadata.create_all)
