# Backend Implementation Plan - Visual Backend Builder

## 1. Project Initialization
- [ ] Create `backend` directory
- [ ] Set up Python Virtual Environment (`venv`)
- [ ] Install dependencies: `fastapi`, `uvicorn`, `sqlalchemy[asyncio]`, `asyncpg`, `pydantic`, `pydantic-settings`, `alembic`
- [ ] Create `.env` file for configuration (DB credentials, Secret keys)

## 2. Directory Structure
```
backend/
├── app/
│   ├── api/            # Route handlers
│   │   └── v1/
│   ├── core/           # Config, Database setup, Security
│   ├── models/         # SQLAlchemy Database Models
│   ├── schemas/        # Pydantic Data Schemas
│   ├── services/       # Business Logic (Workflow Engine, API Generator)
│   └── main.py         # App Entrypoint
├── migrations/         # Alembic migrations
└── requirements.txt
```

## 3. Database & Models (PostgreSQL + SQLAlchemy)
- [ ] Configure `AsyncEngine` and `SessionLocal` in `app/core/database.py`
- [ ] Define **Base Models**:
    - **User**: Authentication & ownership
    - **Workflow**: Stores JSON graph of logic nodes
    - **API_Endpoint**: Defines dynamic endpoints
    - **Database_Connection**: User's external DB credentials (encrypted)
- [ ] Setup Alembic for migrations

## 4. Core API Development
- [ ] **Health Check**: Simple root endpoint
- [ ] **Workflows API**: CRUD for `Workflow` model (Save/Load graphs)
- [ ] **Projects/API Builder**: CRUD for defining endpoints

## 5. Workflow Execution Engine (The Core)
- [ ] Create `WorkflowEngine` service
- [ ] Implement node execution logic (Start -> Process -> End)
- [ ] Support basic node types:
    - **HTTP Response**
    - **Condition (If/Else)**
    - **Variable Set**

## 6. Dynamic Router (Advanced)
- [ ] Implement a system that loads `API_Endpoint` definitions from DB and dynamically registers them as FastAPI routes at runtime (or standardizes a single catch-all route `/execute/{endpoint_id}`).
