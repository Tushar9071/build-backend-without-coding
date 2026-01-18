from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import workflows
from sqlalchemy import text
from app.core.database import engine, Base, settings


app = FastAPI(title="Visual Backend Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
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
from app.api.v1 import github
app.include_router(github.router, prefix="/api/v1/github", tags=["GitHub"])
from app.api.v1 import db_manager
app.include_router(db_manager.router, prefix="/api/v1/db", tags=["Database Manager"])

@app.get("/")
async def root():
    return {"message": "Visual Backend Platform API is running"}

# Startup event to create tables (for dev only - use Alembic for prod)
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        # Create tables if they don't exist. Removed drop_all to persist data.
        await conn.run_sync(Base.metadata.create_all)
        
        # PROVISIONAL MIGRATION: Manually add user_id column if it doesn't exist
        # This is a temporary fix until Alembic is properly set up
        print("Checking for missing columns...")
        try:
             await conn.execute(text("ALTER TABLE workflows ADD COLUMN IF NOT EXISTS user_id VARCHAR"))
             await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_workflows_user_id ON workflows (user_id)"))
             await conn.execute(text("ALTER TABLE db_connections ADD COLUMN IF NOT EXISTS user_id VARCHAR"))
             await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_db_connections_user_id ON db_connections (user_id)"))
             print("Schema check complete.")
        except Exception as e:
            print(f"Schema check warning: {e}")
