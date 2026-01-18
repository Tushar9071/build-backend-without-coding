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
    matched_params = {}
    
    for workflow in workflows:
        if not workflow.nodes:
            continue
            
        # Look for API node
        for node in workflow.nodes:
            if node.get('type') == 'api':
                data = node.get('data', {})
                node_method = data.get('method', 'GET').upper()
                request_method = request.method.upper()
                
                if node_method != request_method:
                    continue

                # Path Matching Logic
                node_path_raw = data.get('path', '/').strip('/')
                input_path_raw = path.strip('/')
                
                # Robust splitting and stripping
                node_parts = [p.strip() for p in node_path_raw.split('/') if p.strip()]
                input_parts = [p.strip() for p in input_path_raw.split('/') if p.strip()]
                
                if len(node_parts) != len(input_parts):
                    continue
                
                is_match = True
                current_params = {}
                
                for i, part in enumerate(node_parts):
                    if part.startswith(':'):
                        # Capture param
                        param_name = part[1:].strip()
                        current_params[param_name] = input_parts[i]
                    elif part != input_parts[i]:
                        is_match = False
                        break
                
                if is_match:
                    matched_workflow = workflow
                    matched_params = current_params
                    matched_node_id = node.get('id')
                    break
        if matched_workflow:
            break
            
    if not matched_workflow:
        raise HTTPException(status_code=404, detail=f"No workflow found for {request.method} /{path}")

    # 3. Parse Body if present
    body_data = {}
    if request.method in ["POST", "PUT", "PATCH"]:
        try:
            body_data = await request.json()
        except:
            body_data = {}
            
    # Prepare input data with structured context
    # Merge extracted params with any existing path params
    final_params = dict(request.path_params)
    final_params.update(matched_params)
    
    input_data = {
        "body": body_data,
        "query": dict(request.query_params),
        "params": final_params,
        "headers": dict(request.headers),
        "method": request.method,
        "path": path,
        "start_node_id": matched_node_id
    }

    # 4. Run Workflow
    workflow_data = {
        "nodes": [n for n in matched_workflow.nodes if n],
        "edges": [e for e in matched_workflow.edges if e]
    }
    
    executor = WorkflowExecutor(workflow_data)
    result = await executor.run(input_data, db_session=db, user_id=matched_workflow.user_id)
    
    # 5. Return Result
    # Unwrap response if it fits standard structure
    if result.get('status') == 'success' and 'response' in result:
        return result['response']
    
    # Or return full execution result for debugging if no direct response
    return result
