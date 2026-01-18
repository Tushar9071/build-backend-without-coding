import asyncio
import os
import sys

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.database import settings

async def fix_schema():
    print(f"Connecting to database...")
    # Ensure we are using the remote DB URL from env if set, otherwise falls back to local
    # Note: In production (Render), DATABASE_URL should be set in environment variables
    
    # We need to make sure we use the REAL database url.
    # The settings object loads from .env, but on Render, 
    # the env vars are injected directly.
    db_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
    
    print(f"Target DB: {db_url.split('@')[-1]}") # Print safe part of URL

    engine = create_async_engine(db_url)
    
    async with engine.begin() as conn:
        print("--- Fixing workflows table ---")
        try:
            await conn.execute(text("ALTER TABLE workflows ADD COLUMN user_id VARCHAR"))
            print("SUCCESS: Added user_id to workflows")
        except Exception as e:
            if "duplicate column" in str(e) or "already exists" in str(e):
                print("SKIPPED: user_id already exists in workflows")
            else:
                print(f"ERROR: {e}")

        try:
            await conn.execute(text("CREATE INDEX ix_workflows_user_id ON workflows (user_id)"))
            print("SUCCESS: Added index ix_workflows_user_id")
        except Exception as e:
            if "already exists" in str(e):
                 print("SKIPPED: Index already exists")
            else:
                print(f"ERROR adding index: {e}")

        print("\n--- Fixing db_connections table ---")
        try:
            await conn.execute(text("ALTER TABLE db_connections ADD COLUMN user_id VARCHAR"))
            print("SUCCESS: Added user_id to db_connections")
        except Exception as e:
            if "duplicate column" in str(e) or "already exists" in str(e):
                print("SKIPPED: user_id already exists in db_connections")
            else:
                print(f"ERROR: {e}")

        try:
            await conn.execute(text("CREATE INDEX ix_db_connections_user_id ON db_connections (user_id)"))
            print("SUCCESS: Added index ix_db_connections_user_id")
        except Exception as e:
             if "already exists" in str(e):
                 print("SKIPPED: Index already exists")
             else:
                print(f"ERROR adding index: {e}")
                
    await engine.dispose()
    print("\nSchema fix complete.")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(fix_schema())
