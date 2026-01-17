from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []

class WorkflowCreate(WorkflowBase):
    pass

class WorkflowResponse(WorkflowBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class APIEndpointBase(BaseModel):
    method: str
    path: str
    workflow_id: UUID
    description: Optional[str] = None

class APIEndpointCreate(APIEndpointBase):
    pass

class APIEndpointResponse(APIEndpointBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
