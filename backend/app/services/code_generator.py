import json
from pathlib import Path
from typing import Dict, Any

class CodeGenerator:
    @staticmethod
    def get_runner_code() -> str:
        # Assumes this is running in backend/app/services/
        path = Path(__file__).parent / "workflow_runner.py"
        return path.read_text(encoding="utf-8")

    @staticmethod
    def generate_main_py(workflow_data: Dict[str, Any]) -> str:
        # We need to escape the json string to be a valid python string literal if we use f-string
        # But simply using json.dumps inside the string is safer.
        workflow_json_str = json.dumps(workflow_data, indent=2)
        
        return f'''import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from workflow_runner import WorkflowExecutor
import json

app = FastAPI()

# Embedded Workflow Data
WORKFLOW_DATA = {workflow_json_str}

@app.all("/{{path:path}}")
async def handle_request(request: Request):
    # Construct input data
    body = None
    try:
        body = await request.json()
    except:
        pass
        
    input_data = {{
        "method": request.method,
        "path": request.url.path,
        "query": dict(request.query_params),
        "params": dict(request.path_params),
        "body": body,
        "headers": dict(request.headers)
    }}
    
    executor = WorkflowExecutor(WORKFLOW_DATA)
    result = executor.run(input_data)
    
    if result.get("status") == "success":
        return result.get("response")
    else:
        # Return error details
        return JSONResponse(status_code=500, content=result)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''

    @staticmethod
    def generate_requirements() -> str:
        return "fastapi>=0.100.0\nuvicorn>=0.20.0\nrequests>=2.31.0"

    @staticmethod
    def generate_dockerfile() -> str:
        return """FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
"""

    @classmethod
    def generate_project_files(cls, workflow_data: Dict[str, Any]) -> Dict[str, str]:
        """
        Returns a dict of filename -> content
        """
        return {
            "main.py": cls.generate_main_py(workflow_data),
            "workflow_runner.py": cls.get_runner_code(),
            "requirements.txt": cls.generate_requirements(),
            "Dockerfile": cls.generate_dockerfile()
        }

    @classmethod
    def generate_zip(cls, workflow_data: Dict[str, Any]) -> bytes:
        import io
        import zipfile
        
        files = cls.generate_project_files(workflow_data)
        buffer = io.BytesIO()
        
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for filename, content in files.items():
                zip_file.writestr(filename, content)
                
        buffer.seek(0)
        return buffer.read()
