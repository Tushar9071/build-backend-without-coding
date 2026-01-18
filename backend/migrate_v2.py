
import asyncio
from sqlalchemy import text
from app.core.database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Migrating: Adding category column to workflows...")
        try:
            await conn.execute(text("ALTER TABLE workflows ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'route'"))
            print("Migration successful.")
        except Exception as e:
            print(f"Migration failed (might already exist): {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
