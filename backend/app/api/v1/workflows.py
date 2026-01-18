from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.core.database import get_db
from app.models.workflow import Workflow
from app.schemas.workflow import WorkflowCreate, WorkflowResponse, WorkflowBase
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=WorkflowResponse)
async def create_workflow(workflow: WorkflowCreate, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user)):
    new_workflow = Workflow(**workflow.dict(), user_id=user_id)
    db.add(new_workflow)
    await db.commit()
    await db.refresh(new_workflow)
    return new_workflow

@router.get("/", response_model=List[WorkflowResponse])
async def list_workflows(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user)):
    result = await db.execute(select(Workflow).filter(Workflow.user_id == user_id).offset(skip).limit(limit))
    return result.scalars().all()

@router.get("/validate-path")
async def validate_path_availability(
    path: str, 
    method: str, 
    exclude_workflow_id: str = None, 
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    # Normalize path
    path = path.strip('/')
    method = method.upper()
    
    # Fetch all workflows (optimize later with better query filtering on JSON)
    result = await db.execute(select(Workflow).filter(Workflow.user_id == user_id))
    workflows = result.scalars().all()
    
    for workflow in workflows:
        if str(workflow.id) == exclude_workflow_id:
            continue
            
        if not workflow.nodes:
            continue
            
        for node in workflow.nodes:
            if node.get('type') == 'api':
                data = node.get('data', {})
                w_path = data.get('path', '/').strip('/')
                w_method = data.get('method', 'GET').upper()
                
                if w_path == path and w_method == method:
                    return {
                        "valid": False,
                        "message": f"Path '{path}' is already used by workflow: {workflow.name}"
                    }
                    
    return {"valid": True, "message": "Path available"}

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user)):
    result = await db.execute(select(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == user_id))
    workflow = result.scalars().first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(workflow_id: str, workflow_update: WorkflowBase, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user)):
    result = await db.execute(select(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == user_id))
    workflow = result.scalars().first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Update fields
    workflow.name = workflow_update.name
    if workflow_update.description is not None:
        workflow.description = workflow_update.description
    if workflow_update.nodes is not None:
        workflow.nodes = workflow_update.nodes
    if workflow_update.edges is not None:
        workflow.edges = workflow_update.edges

    await db.commit()
    await db.refresh(workflow)
    return workflow

@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user)):
    result = await db.execute(select(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == user_id))
    workflow = result.scalars().first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    await db.delete(workflow)
    await db.commit()
    return {"message": "Workflow deleted successfully"}

@router.post("/{workflow_id}/run")
async def run_workflow(workflow_id: str, input_data: dict, db: AsyncSession = Depends(get_db), user_id: str = Depends(get_current_user)):
    # Fetch workflow definition
    result = await db.execute(select(Workflow).filter(Workflow.id == workflow_id, Workflow.user_id == user_id))
    workflow = result.scalars().first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    # Prepare workflow data structure compatible with executor
    # SQLAlchemy model -> dict
    workflow_data = {
        "nodes": [n for n in workflow.nodes if n], # Ensure valid list
        "edges": [e for e in workflow.edges if e]
    }
    
    from app.services.workflow_runner import WorkflowExecutor
    executor = WorkflowExecutor(workflow_data)
    result = await executor.run(input_data, db_session=db, user_id=user_id)
    
    return result
