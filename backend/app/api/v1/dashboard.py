from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
import random
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.workflow import APIEndpoint, DatabaseConnection
from app.schemas.dashboard import DashboardStats, ActivityItem

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Count active endpoints
    result_endpoints = await db.execute(select(func.count(APIEndpoint.id)))
    active_endpoints_count = result_endpoints.scalar() or 0

    # Count DB connections
    result_db = await db.execute(select(func.count(DatabaseConnection.id)))
    db_connections_count = result_db.scalar() or 0

    # Mock avg latency and activities for now
    mock_activities = []
    methods = ["GET", "POST", "PUT", "DELETE"]
    endpoints_list = ["/api/v1/users", "/api/v1/products", "/api/v1/auth/login", "/api/v1/orders"]
    
    for i in range(5):
        mock_activities.append(
            ActivityItem(
                id=i,
                method=random.choice(methods),
                endpoint=random.choice(endpoints_list),
                status="200 OK",
                status_code=200,
                time=f"{random.randint(1, 10)} mins ago",
                duration=f"{random.randint(50, 200)}ms"
            )
        )

    return DashboardStats(
        active_endpoints=active_endpoints_count,
        db_connections=db_connections_count,
        avg_latency=f"{random.randint(40, 60)}ms",
        recent_activities=mock_activities
    )
