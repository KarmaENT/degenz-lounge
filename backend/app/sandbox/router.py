from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid
import json

from app.database import get_db
from app.models import SandboxSession, SandboxAgent, Agent, ChatMessage
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/sandbox", tags=["sandbox"])

# Schemas
class SandboxSessionBase(BaseModel):
    name: str
    configuration: dict = {}

class SandboxSessionCreate(SandboxSessionBase):
    pass

class SandboxSessionUpdate(SandboxSessionBase):
    pass

class SandboxSessionResponse(SandboxSessionBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: str
    updated_at: str
    
    class Config:
        orm_mode = True

class SandboxAgentBase(BaseModel):
    agent_id: uuid.UUID
    position_x: int = 0
    position_y: int = 0
    configuration: dict = {}

class SandboxAgentCreate(SandboxAgentBase):
    pass

class SandboxAgentUpdate(BaseModel):
    position_x: Optional[int] = None
    position_y: Optional[int] = None
    configuration: Optional[dict] = None

class SandboxAgentResponse(SandboxAgentBase):
    id: uuid.UUID
    session_id: uuid.UUID
    
    class Config:
        orm_mode = True

class AgentPositionUpdate(BaseModel):
    position_x: int
    position_y: int

# Routes
@router.get("/sessions", response_model=List[SandboxSessionResponse])
async def get_sessions(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    sessions = db.query(SandboxSession).filter(SandboxSession.user_id == current_user.id).offset(skip).limit(limit).all()
    return sessions

@router.post("/sessions", response_model=SandboxSessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SandboxSessionCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    new_session = SandboxSession(
        **session_data.dict(),
        user_id=current_user.id
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return new_session

@router.get("/sessions/{session_id}", response_model=SandboxSessionResponse)
async def get_session(
    session_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    session = db.query(SandboxSession).filter(
        SandboxSession.id == session_id,
        SandboxSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not owned by you"
        )
    
    return session

@router.put("/sessions/{session_id}", response_model=SandboxSessionResponse)
async def update_session(
    session_id: uuid.UUID, 
    session_data: SandboxSessionUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    session = db.query(SandboxSession).filter(
        SandboxSession.id == session_id,
        SandboxSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not owned by you"
        )
    
    for key, value in session_data.dict().items():
        setattr(session, key, value)
    
    db.commit()
    db.refresh(session)
    
    return session

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    session = db.query(SandboxSession).filter(
        SandboxSession.id == session_id,
        SandboxSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not owned by you"
        )
    
    db.delete(session)
    db.commit()
    
    return None

@router.get("/sessions/{session_id}/agents", response_model=List[SandboxAgentResponse])
async def get_session_agents(
    session_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify session ownership
    session = db.query(SandboxSession).filter(
        SandboxSession.id == session_id,
        SandboxSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not owned by you"
        )
    
    agents = db.query(SandboxAgent).filter(SandboxAgent.session_id == session_id).all()
    return agents

@router.post("/sessions/{session_id}/agents", response_model=SandboxAgentResponse, status_code=status.HTTP_201_CREATED)
async def add_agent_to_session(
    session_id: uuid.UUID, 
    agent_data: SandboxAgentCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify session ownership
    session = db.query(SandboxSession).filter(
        SandboxSession.id == session_id,
        SandboxSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not owned by you"
        )
    
    # Verify agent ownership or public status
    agent = db.query(Agent).filter(
        Agent.id == agent_data.agent_id,
        (Agent.user_id == current_user.id) | (Agent.is_public == True)
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found, not owned by you, or not public"
        )
    
    new_sandbox_agent = SandboxAgent(
        session_id=session_id,
        **agent_data.dict()
    )
    
    db.add(new_sandbox_agent)
    db.commit()
    db.refresh(new_sandbox_agent)
    
    return new_sandbox_agent

@router.delete("/sessions/{session_id}/agents/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_agent_from_session(
    session_id: uuid.UUID, 
    agent_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify session ownership
    session = db.query(SandboxSession).filter(
        SandboxSession.id == session_id,
        SandboxSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not owned by you"
        )
    
    sandbox_agent = db.query(SandboxAgent).filter(
        SandboxAgent.session_id == session_id,
        SandboxAgent.id == agent_id
    ).first()
    
    if not sandbox_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found in this session"
        )
    
    db.delete(sandbox_agent)
    db.commit()
    
    return None

@router.put("/sessions/{session_id}/agents/{agent_id}/position", response_model=SandboxAgentResponse)
async def update_agent_position(
    session_id: uuid.UUID, 
    agent_id: uuid.UUID, 
    position_data: AgentPositionUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify session ownership
    session = db.query(SandboxSession).filter(
        SandboxSession.id == session_id,
        SandboxSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or not owned by you"
        )
    
    sandbox_agent = db.query(SandboxAgent).filter(
        SandboxAgent.session_id == session_id,
        SandboxAgent.id == agent_id
    ).first()
    
    if not sandbox_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found in this session"
        )
    
    sandbox_agent.position_x = position_data.position_x
    sandbox_agent.position_y = position_data.position_y
    
    db.commit()
    db.refresh(sandbox_agent)
    
    return sandbox_agent
