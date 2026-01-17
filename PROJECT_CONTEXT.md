# Project Context & Architecture Documentation

This document provides a comprehensive overview of the `uibackend` project. It is designed to help AI agents and developers quickly understand the codebase, its architecture, and how to implement changes.

## 1. Project Overview
**Name**: UI Backend / Workflow Builder
**Purpose**: A visual, node-based workflow automation tool (similar to n8n or Zapier) that allows users to define API logic, conditional flow, loops, and data manipulation graphically. The backend executes these workflows as API endpoints.

## 2. Technology Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS v3 (Dark Mode centered)
- **State Management**: Zustandss
- **Graph/Canvas**: `@xyflow/react` (React Flow)
- **Icons**: `lucide-react`
- **Notifications**: `react-hot-toast`
- **HTTP Client**: Axios with dynamic base URL support.

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn
- **Data Handling**: Pydantic v2
- **Execution Engine**: Custom Graph Traversal (BFS/Cycle-aware)
- **Database**: PostgreSQL (SQLAlchemy Async + AsyncPG)

## 3. Core Architecture

The system consists of a visual **Builder** (Frontend) and an **Execution Engine** (Backend).
Workflows are saved as JSON structures containing `nodes` and `edges`, which the backend processes.

### File Structure Map
```
/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # REST Endpoints (workflows.py, invoke.py)
│   │   ├── core/
│   │   │   └── database.py # DB Settings, Engine, and Env management
│   │   ├── main.py         # Entry point (CORS, Middlewares)
│   │   ├── services/
│   │   │   └── workflow_runner.py  # <--- CORE EXECUTION LOGIC
│   │   └── schemas/        # Pydantic models
│   └── .env                # Backend Secrets (DB_URL, etc.)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── nodes/      # Custom Node Components (ApiNode, MathNode, DataNode, etc.)
│   │   │   └── ui/         # Generic UI (NodesToolbar, etc.)
│   │   ├── pages/
│   │   │   └── WorkflowBuilder.tsx # <--- MAIN CANVAS COMPONENT
│   │   ├── store/          # Zustand Stores (workflowStore, themeStore)
│   │   ├── hooks/          # Custom hooks (useUndoRedo)
│   │   └── lib/
│   │       └── api.ts      # Axios wrapper w/ VITE_API_BASE_URL support
│   └── .env                # Frontend Configuration (VITE_API_BASE_URL)
└── docker-compose.yml
```

## 4. Key Components & Logic

### A. The Nodes (Frontend)
All custom nodes live in `frontend/src/components/nodes/`. They must be registered in `WorkflowBuilder.tsx`'s `nodeTypes`.

1.  **ApiNode (`api`)**: Entry point. Defines HTTP method/path. Shows dynamic Invocation URL.
2.  **InterfaceNode (`interface`)**: Defines request schema.
3.  **VariableNode (`variable`)**: Stores/updates data.
4.  **MathNode (`math`)** (NEW):
    *   Performs arithmetic (`+`, `-`, `*`, `/`, `%`).
    *   Dynamic inputs (strings or numbers).
    *   Stores result in specified variable.
5.  **DataNode (`data_op`)** (NEW):
    *   Performs aggregations on Collections.
    *   Ops: `Sum`, `Count`, `Avg`, `Min`, `Max`.
    *   Takes Collection Name (e.g., `body.items`) and Output Variable.
6.  **LogicNode (`logic`)**: Conditional branching (If/Else).
7.  **LoopNode (`loop`)**: Iterates over arrays.
8.  **ResponseNode (`response`)**: Returns final API response.

### B. The Execution Engine (Backend)
Located in `backend/app/services/workflow_runner.py`.

**Class: `WorkflowExecutor`**
*   **`_resolve_val(val)`**: Helper to resolve `{variable}` substitutions and variable lookups recursively.
*   **`execute_node(node)`**:
    *   **math**: coercion to float/int, handles division by zero.
    *   **data_op**: extracts numbers from list collections and applies Python's `sum`, `min`, `max`, etc.
    *   **loop**: Robust collection resolution (supports dot notation `body.users`).

### C. Configuration & Environment
*   **Backend**: 
    *   Uses `pydantic-settings` in `app/core/database.py`.
    *   Env Vars: `DATABASE_URL`, `FRONTEND_URL`.
*   **Frontend**: 
    *   Uses Vite's `import.meta.env`.
    *   Env Vars: `VITE_API_BASE_URL`.
    *   Production: Uses these vars to point to correct API and display correct Invocation URLs.

## 5. How to Make Changes

### Adding a New Node Type
1.  **Frontend**:
    -   Create `MyNewNode.tsx` in `components/nodes`.
    -   Register in `pages/WorkflowBuilder.tsx` (`nodeTypes`).
    -   Add to `components/ui/NodesToolbar.tsx`.
2.  **Backend**:
    -   Update `workflow_runner.py`:
        -   Add `elif node_type == 'my_new_node':` in `execute_node`.
        -   Implement logic (interactions with `self.context`).

### Build & Deploy
*   **Backend**: `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
*   **Frontend**: `npm run build` -> Serve `dist/`.

## 6. Current State & Notes
*   **Status**: Active Development.
*   **Recent Fixes**:
    *   Resolved all React build errors (unused vars).
    *   Fixed Backend CORS and startup crashes by adding `FRONTEND_URL` to Settings.
    *   Fixed Production URL display in `ApiNode`.
*   **Git**: Repository initialized, `.gitignore` configured for sensitive files.
