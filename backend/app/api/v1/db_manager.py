from fastapi import APIRouter, HTTPException, Body, Depends
from pydantic import BaseModel
from typing import Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.services.external_db import ExternalDbService
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.workflow import DatabaseConnection

router = APIRouter()

class ConnectionRequest(BaseModel):
    url: str
    type: str = "postgresql"

class QueryRequest(BaseModel):
    query: str

@router.post("/connect")
async def connect_database(request: ConnectionRequest, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user)):
    # Validate
    result = await ExternalDbService.test_connection(request.url)
    if not result['success']:
        raise HTTPException(status_code=400, detail=result['message'])
    
    # Save to DB (One connection per user for now in this simple UI, or update existing)
    # Check if exists
    result_db = await db.execute(select(DatabaseConnection).filter(DatabaseConnection.user_id == user_id))
    existing = result_db.scalars().first()
    
    if existing:
        existing.connection_string = request.url
        existing.type = request.type
    else:
        new_conn = DatabaseConnection(
            name="My Database", 
            type=request.type, 
            connection_string=request.url,
            user_id=user_id
        )
        db.add(new_conn)
        
    await db.commit()
    return {"message": "Database connected successfully"}

@router.get("/config")
async def get_config(db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user)):
    result = await db.execute(select(DatabaseConnection).filter(DatabaseConnection.user_id == user_id))
    conn = result.scalars().first()
    
    if conn:
        return {"url": conn.connection_string}
    return {"url": ""}

@router.get("/tables")
async def get_tables(db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user)):
    result = await db.execute(select(DatabaseConnection).filter(DatabaseConnection.user_id == user_id))
    conn = result.scalars().first()
    
    if not conn:
        raise HTTPException(status_code=400, detail="Database not configured")
    try:
        tables = await ExternalDbService.get_tables(conn.connection_string)
        return tables
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def run_query(request: QueryRequest, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user)):
    result = await db.execute(select(DatabaseConnection).filter(DatabaseConnection.user_id == user_id))
    conn = result.scalars().first()
    
    if not conn:
        raise HTTPException(status_code=400, detail="Database not configured")
    
    try:
        rows = await ExternalDbService.execute_query(request.query, url=conn.connection_string)
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
@router.get("/table/{table_name}")
async def get_table_data(table_name: str, limit: int = 100, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user)):
    result = await db.execute(select(DatabaseConnection).filter(DatabaseConnection.user_id == user_id))
    conn = result.scalars().first()
    
    if not conn:
        raise HTTPException(status_code=400, detail="Database not configured")

    try:
        # Sanitize table name (basic)
        safe_name = "".join(c for c in table_name if c.isalnum() or c == '_')
        query = f"SELECT * FROM {safe_name} LIMIT {limit}"
        rows = await ExternalDbService.execute_query(query, url=conn.connection_string)
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
