from fastapi import APIRouter, Depends, HTTPException, Body, Response
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.workflow import Workflow
from app.services.code_generator import CodeGenerator
from app.services.github_service import GithubService
from uuid import UUID

router = APIRouter()

class DeployRequest(BaseModel):
    github_token: str
    repo_name: str
    workflow_id: UUID

@router.post("/deploy")
async def deploy_workflow(request: DeployRequest, db: AsyncSession = Depends(get_db)):
    # 1. Fetch Workflow
    workflow = await db.get(Workflow, request.workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    # 2. Prepare Data
    workflow_data = {
        "nodes": workflow.nodes,
        "edges": workflow.edges
    }
    
    # 3. Generate Code
    try:
        files = CodeGenerator.generate_project_files(workflow_data)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Code generation failed: {str(e)}")
        
    # 4. Push to GitHub
    try:
        repo_url = GithubService.push_to_github(
            token=request.github_token, 
            repo_name=request.repo_name, 
            files=files
        )
        return {"status": "success", "repo_url": repo_url}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"GitHub deployment failed: {str(e)}")

@router.get("/download/{workflow_id}")
async def download_workflow_zip(workflow_id: UUID, db: AsyncSession = Depends(get_db)):
    workflow = await db.get(Workflow, workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    workflow_data = {
        "nodes": workflow.nodes,
        "edges": workflow.edges
    }
    
    try:
        zip_bytes = CodeGenerator.generate_zip(workflow_data)
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename=workflow_app_{workflow.name.replace(' ', '_')}.zip"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Zip generation failed: {str(e)}")
