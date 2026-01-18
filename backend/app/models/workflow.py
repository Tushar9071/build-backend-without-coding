from sqlalchemy import Column, String, JSON, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base

class Project(Base):
    """Master container for workflows - groups Routes, Functions, Interfaces together"""
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    user_id = Column(String, nullable=True, index=True)  # Firebase UID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to workflows
    workflows = relationship("Workflow", back_populates="project", cascade="all, delete-orphan")

class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    nodes = Column(JSON, default=[])  # Stores the React Flow nodes
    edges = Column(JSON, default=[])  # Stores the React Flow edges
    user_id = Column(String, nullable=True, index=True)  # Firebase UID
    category = Column(String, default="route", nullable=False, index=True)  # route, function, interface
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship to project
    project = relationship("Project", back_populates="workflows")

class APIEndpoint(Base):
    __tablename__ = "api_endpoints"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    method = Column(String, nullable=False)  # GET, POST, PUT, DELETE
    path = Column(String, nullable=False, unique=True)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"))
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class DatabaseConnection(Base):
    __tablename__ = "db_connections"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # postgres, mysql, etc
    connection_string = Column(String, nullable=False)  # In real app, encrypt this!
    user_id = Column(String, nullable=True, index=True)  # Firebase UID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
