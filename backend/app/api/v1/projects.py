from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from app.core.database import get_db
from app.models.workflow import Project, Workflow
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectDetailResponse, WorkflowSummary
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate, 
    db: AsyncSession = Depends(get_db), 
    user_id: str = Depends(get_current_user)
):
    """Create a new master workflow (project)"""
    new_project = Project(**project.dict(), user_id=user_id)
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    return new_project

@router.get("/", response_model=List[ProjectResponse])
async def list_projects(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db), 
    user_id: str = Depends(get_current_user)
):
    """List all projects for the current user"""
    result = await db.execute(
        select(Project)
        .filter(Project.user_id == user_id)
        .order_by(Project.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: str, 
    db: AsyncSession = Depends(get_db), 
    user_id: str = Depends(get_current_user)
):
    """Get a project with all its workflows grouped by category"""
    result = await db.execute(
        select(Project)
        .filter(Project.id == project_id, Project.user_id == user_id)
        .options(selectinload(Project.workflows))
    )
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Group workflows by category
    routes = [WorkflowSummary.model_validate(w) for w in project.workflows if w.category == 'route']
    functions = [WorkflowSummary.model_validate(w) for w in project.workflows if w.category == 'function']
    interfaces = [WorkflowSummary.model_validate(w) for w in project.workflows if w.category == 'interface']
    
    return ProjectDetailResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
        routes=routes,
        functions=functions,
        interfaces=interfaces
    )

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    project_update: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Update a project"""
    result = await db.execute(
        select(Project).filter(Project.id == project_id, Project.user_id == user_id)
    )
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.name = project_update.name
    if project_update.description is not None:
        project.description = project_update.description
    
    await db.commit()
    await db.refresh(project)
    return project

@router.delete("/{project_id}")
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Delete a project and all its workflows"""
    result = await db.execute(
        select(Project).filter(Project.id == project_id, Project.user_id == user_id)
    )
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    await db.delete(project)
    await db.commit()
    return {"message": "Project deleted successfully"}

@router.post("/{project_id}/workflows")
async def create_workflow_in_project(
    project_id: str,
    workflow_name: str,
    category: str = "route",
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    """Create a new workflow inside a project"""
    # Verify project exists
    result = await db.execute(
        select(Project).filter(Project.id == project_id, Project.user_id == user_id)
    )
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    new_workflow = Workflow(
        name=workflow_name,
        category=category,
        project_id=project_id,
        user_id=user_id
    )
    db.add(new_workflow)
    await db.commit()
    await db.refresh(new_workflow)
    
    return {
        "id": str(new_workflow.id),
        "name": new_workflow.name,
        "category": new_workflow.category,
        "project_id": str(new_workflow.project_id)
    }
