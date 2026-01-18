import json
import os
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncEngine
from sqlalchemy import text, inspect
from pydantic import BaseModel

class ExternalDbService:
    # Cache engines by URL
    _engines: Dict[str, AsyncEngine] = {}

    @classmethod
    async def get_engine(cls, url: str) -> Optional[AsyncEngine]:
        if not url:
            return None
        
        # Normalize
        if url.startswith("postgresql://") and "asyncpg" not in url:
             url = url.replace("postgresql://", "postgresql+asyncpg://")
        
        if url in cls._engines:
            return cls._engines[url]
        
        try:
            engine = create_async_engine(url, echo=False)
            cls._engines[url] = engine
            return engine
        except Exception as e:
            print(f"Failed to create engine: {e}")
            return None

    @classmethod
    async def test_connection(cls, url: str) -> Dict[str, Any]:
        test_url = url
        if test_url.startswith("postgresql://") and "asyncpg" not in test_url:
             test_url = test_url.replace("postgresql://", "postgresql+asyncpg://")

        try:
            engine = create_async_engine(test_url)
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            await engine.dispose()
            return {"success": True, "message": "Connection successful"}
        except Exception as e:
            return {"success": False, "message": str(e)}

    @classmethod
    async def get_tables(cls, url: str) -> List[str]:
        engine = await cls.get_engine(url)
        if not engine:
            return []
        
        try:
            async with engine.connect() as conn:
                def get_names(connection):
                    inspector = inspect(connection)
                    return inspector.get_table_names()
                
                tables = await conn.run_sync(get_names)
                return tables
        except Exception as e:
            print(f"Error fetching tables: {e}")
            raise e

    @classmethod
    async def execute_query(cls, query: str, params: dict = None, url: str = None) -> Any:
        if not url:
            raise Exception("No URL provided")
            
        engine = await cls.get_engine(url)
        if not engine:
            raise Exception("Could not connect to database")
        
        async with engine.begin() as conn:
            result = await conn.execute(text(query), params or {})
            if result.returns_rows:
                return [dict(row) for row in result.mappings().all()]
            return {"rowcount": result.rowcount}
