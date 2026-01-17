from pydantic import BaseModel
from typing import List

class ActivityItem(BaseModel):
    id: int
    method: str
    endpoint: str
    status: str
    time: str
    duration: str
    status_code: int # e.g. 200

class DashboardStats(BaseModel):
    active_endpoints: int
    db_connections: int
    avg_latency: str
    recent_activities: List[ActivityItem]
