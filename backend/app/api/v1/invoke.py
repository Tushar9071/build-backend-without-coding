from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.core.database import get_db
from app.models.workflow import Workflow
from app.services.workflow_runner import WorkflowExecutor
import re

router = APIRouter()

def match_path(node_path: str, request_path: str) -> tuple[bool, dict]:
    """
    Matches generic path (e.g. users/:id) with request path (e.g. users/123).
    Returns (True, {id: 123}) if matched.
    """
    # Normalize
    n_parts = [p for p in node_path.strip('/').split('/') if p]
    r_parts = [p for p in request_path.strip('/').split('/') if p]
    
    if len(n_parts) != len(r_parts):
        return False, {}
    
    params = {}
    
    for n, r in zip(n_parts, r_parts):
        if n.startswith(':'):
            # Param
            key = n[1:]
            params[key] = r
        elif n != r:
            return False, {}
            
    return True, params

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
async def invoke_workflow(path: str, request: Request, db: AsyncSession = Depends(get_db)):
    # 1. Fetch all workflows
    result = await db.execute(select(Workflow))
    workflows = result.scalars().all()
    
    matched_workflow = None
    extracted_params = {}
    
    # 2. Find matching workflow
    for workflow in workflows:
        if not workflow.nodes:
            continue
            
        # Look for API node
        for node in workflow.nodes:
            if node.get('type') == 'api':
                data = node.get('data', {})
                node_path = data.get('path', '/').strip('/')
                node_method = data.get('method', 'GET').upper()
                request_method = request.method.upper()
                
                # Method Check
                if node_method != request_method:
                    continue
                
                # Path Check
                is_match, params = match_path(node_path, path)
                if is_match:
                    matched_workflow = workflow
                    extracted_params = params
                    break
        if matched_workflow:
            break
            
    if not matched_workflow:
        raise HTTPException(status_code=404, detail=f"No workflow found for {request.method} /{path}")

    # 3. Parse Body
    body_data = {}
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            body_data = await request.json()
        except:
            body_data = {}
            
    # Prepare input data
    input_data = {
        "body": body_data,
        "query": dict(request.query_params),
        "params": {**dict(request.path_params), **extracted_params}, # Merge FastAPI params with our extracted params
        "headers": dict(request.headers),
        "method": request.method,
        "path": path,
        "user": None # Auth not yet implemented in node context, but good placeholder
    }

    # 4. Run Workflow
    workflow_data = {
        "nodes": [n for n in matched_workflow.nodes if n],
        "edges": [e for e in matched_workflow.edges if e]
    }
    
    # Pass DB Session!
    executor = WorkflowExecutor(workflow_data, db_session=db)
    result = await executor.run(input_data)
    
    # 5. Return Result
    if result.get('status') == 'success' and 'response' in result:
        return result['response']

    # If error or no specific response, return result (for debug) or error
    if result.get('status') == 'error':
         raise HTTPException(status_code=500, detail=result.get('error'))
         
    return result
