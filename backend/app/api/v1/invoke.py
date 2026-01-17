from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.workflow import Workflow
from app.services.workflow_runner import WorkflowExecutor
from typing import Optional
import json

router = APIRouter()

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def invoke_workflow(path: str, request: Request, db: AsyncSession = Depends(get_db)):
    # 1. Fetch all workflows
    # Ideally we should filter in DB, but JSON filtering is DB-specific.
    # For MVP, fetch all and filter in memory.
    result = await db.execute(select(Workflow))
    workflows = result.scalars().all()
    
    matched_workflow = None
    
    # 2. Find matching workflow based on API Node configuration
    for workflow in workflows:
        if not workflow.nodes:
            continue
            
        # Look for API node
        for node in workflow.nodes:
            if node.get('type') == 'api':
                data = node.get('data', {})
                # Normalize path: remove leading slash for comparison if needed
                node_path = data.get('path', '/').strip('/')
                input_path = path.strip('/')
                
                node_method = data.get('method', 'GET').upper()
                request_method = request.method.upper()
                
                if node_path == input_path and node_method == request_method:
                    matched_workflow = workflow
                    break
        if matched_workflow:
            break
            
    if not matched_workflow:
        raise HTTPException(status_code=404, detail=f"No workflow found for {request.method} /{path}")

    # 3. Parse Body if present
    input_data = {}
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            input_data = await request.json()
        except:
            input_data = {}
    
    # Add query params to input
    input_data.update(dict(request.query_params))

    # 4. Run Workflow
    workflow_data = {
        "nodes": [n for n in matched_workflow.nodes if n],
        "edges": [e for e in matched_workflow.edges if e]
    }
    
    executor = WorkflowExecutor(workflow_data)
    result = executor.run(input_data)
    
    # 5. Return Result
    # Unwrap response if it fits standard structure
    if result.get('status') == 'success' and 'response' in result:
        return result['response']
    
    # Or return full execution result for debugging if no direct response
    return result
