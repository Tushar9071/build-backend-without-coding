# Project Context & Architecture Documentation

This document provides a comprehensive overview of the `uibackend` project. It is designed to help AI agents and developers quickly understand the codebase, its architecture, and how to implement changes.

## 1. Project Overview
**Name**: UI Backend / Workflow Builder
**Purpose**: A visual, node-based workflow automation tool (similar to n8n or Zapier) that allows users to define API logic, conditional flow, loops, and data manipulation graphically. The backend executes these workflows as API endpoints.

## 2. Technology Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS v3/v4 (Dark Mode centered)
- **State Management**: Zustand
- **Graph/Canvas**: `@xyflow/react` (React Flow)
- **Icons**: `lucide-react`
- **Notifications**: `react-hot-toast`

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Server**: Uvicorn
- **Data Handling**: Pydantic v2
- **Execution Engine**: Custom Graph Traversal (BFS/Cycle-aware)

## 3. Core Architecture

The system consists of a visual **Builder** (Frontend) and an **Execution Engine** (Backend).
Workflows are saved as JSON structures containing `nodes` and `edges`, which the backend processes.

### File Structure Map
```
/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # REST Endpoints (workflows.py, invoke.py)
│   │   ├── main.py         # Entry point
│   │   ├── services/
│   │   │   └── workflow_runner.py  # <--- CORE EXECUTION LOGIC
│   │   └── schemas/        # Pydantic models
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── nodes/      # Custom Node Components (ApiNode, LogicNode, etc.)
│   │   │   └── ui/         # Generic UI (NodesToolbar, etc.)
│   │   ├── pages/
│   │   │   └── WorkflowBuilder.tsx # <--- MAIN CANVAS COMPONENT
│   │   ├── store/          # Zustand Stores (workflowStore, themeStore)
│   │   └── hooks/          # Custom hooks (useUndoRedo)
└── docker-compose.yml
```

## 4. Key Components & Logic

### A. The Nodes (Frontend)
All custom nodes live in `frontend/src/components/nodes/`. They must be registered in `WorkflowBuilder.tsx`'s `nodeTypes`.

1.  **ApiNode (`api`)**: Entry point. Defines HTTP method/path.
2.  **InterfaceNode (`interface`)**: Defines request schema (body validation).
3.  **VariableNode (`variable`)**:
    -   Stores/updates data.
    -   Supports String, Number, Boolean, JSON, Array.
    -   **Inputs**: Top Handle (update value), Right Handle (continue flow).
    -   **Dynamic**: Accepts `{variable}` substitution.
4.  **LogicNode (`logic`)**:
    -   Conditional branching (If/Else).
    -   Outputs: "True" and "False" handles.
5.  **LoopNode (`loop`)**:
    -   Iterates over arrays (`body.items`).
    -   Outputs: "Next" (Do) and "Done" (Finished).
6.  **ResponseNode (`response`)**: Returns final API response.

### B. The Execution Engine (Backend)
Located in `backend/app/services/workflow_runner.py`.

**Class: `WorkflowExecutor`**
*   **`__init__`**: Builds adjacency list from edges.
*   **`run(input_data)`**:
    -   Initializes Global Context.
    -   Runs BFS-like traversal.
    -   Manages `_loop_states`.
    -   Returns final response or execution logs.
*   **`execute_node(node)`**:
    -   Contains specific logic for each node type.
    -   **Variables**: Performs string substitution (e.g., replaces `{body.id}` with actual ID).
    -   **Loops**: execution returns `{"result": "do"}` or `{"result": "done"}`.

### C. Data Flow & Context
*   **Context**: A global dictionary `self.context` shared across the execution.
*   **Initialization**: `input_data` (body, query, params) is flattened into `context` at start.
*   **Substitution**: Strings like `{varName}` are replaced with values from context at runtime.

### D. Looping Logic
Loops are handled by the `LoopNode` type:
1.  **State**: Tracks current index in `context['_loop_states']`.
2.  **Routing**:
    -   If items remain: Routes to `do` handle.
    -   If finished: Routes to `done` handle.
3.  **Frontend Wiring**: Users must connect the end of the "Do" chain back to the Loop Node's input handle to close the cycle.

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

### Improving Execution
*   Modify `workflow_runner.py`.
*   Note: `execute_node` returns a dict. If it returns `{ "type": "response", ... }`, the workflow halts and responds immediately.

### Styling
*   Use tailwind classes.
*   Common Theme: Dark mode (`bg-slate-900`, `border-slate-800`, Text `slate-300`).
*   **Crucial**: Add `nodrag` class to all form elements (inputs, selects) inside nodes prevents dragging the node when interacting.

## 6. Current State & Notes
*   **Undo/Redo**: Implemented via `useUndoRedo` hook.
*   **Theme**: Dark/Light mode support (persisted in local storage).
*   **Run**: "Run" button opens a modal to test workflows with JSON input.
