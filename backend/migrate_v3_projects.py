import asyncio
from sqlalchemy import text
from app.core.database import engine

async def migrate():
    async with engine.begin() as conn:
        print("Migrating: Creating projects table...")
        try:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS projects (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR NOT NULL,
                    description TEXT,
                    user_id VARCHAR,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE
                )
            """))
            print("Projects table created.")
        except Exception as e:
            print(f"Projects table might already exist: {e}")
        
        print("Migrating: Adding project_id column to workflows...")
        try:
            await conn.execute(text("""
                ALTER TABLE workflows 
                ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL
            """))
            print("project_id column added to workflows.")
        except Exception as e:
            print(f"project_id column might already exist: {e}")
        
        print("Creating index on project_id...")
        try:
            await conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_workflows_project_id ON workflows(project_id)
            """))
            print("Index created.")
        except Exception as e:
            print(f"Index might already exist: {e}")
        
        print("Migration complete!")

if __name__ == "__main__":
    asyncio.run(migrate())
