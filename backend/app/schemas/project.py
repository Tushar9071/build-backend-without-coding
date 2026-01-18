from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from uuid import UUID
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class WorkflowSummary(BaseModel):
    id: UUID
    name: str
    category: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProjectResponse(ProjectBase):
    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ProjectDetailResponse(ProjectResponse):
    """Project with nested workflows grouped by category"""
    routes: List[WorkflowSummary] = []
    functions: List[WorkflowSummary] = []
    interfaces: List[WorkflowSummary] = []
