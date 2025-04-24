from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid

from app.database import get_db
from app.models import Agent
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/agents", tags=["agents"])

# Schemas
class AgentBase(BaseModel):
    name: str
    description: Optional[str] = None
    system_prompt: str
    is_public: bool = False
    configuration: dict = {}

class AgentCreate(AgentBase):
    pass

class AgentUpdate(AgentBase):
    pass

class AgentResponse(AgentBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: str
    updated_at: str
    
    class Config:
        orm_mode = True

# Routes
@router.get("/", response_model=List[AgentResponse])
async def get_agents(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    agents = db.query(Agent).filter(Agent.user_id == current_user.id).offset(skip).limit(limit).all()
    return agents

@router.post("/", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_data: AgentCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    new_agent = Agent(
        **agent_data.dict(),
        user_id=current_user.id
    )
    
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    
    return new_agent

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    return agent

@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: uuid.UUID, 
    agent_data: AgentUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    for key, value in agent_data.dict().items():
        setattr(agent, key, value)
    
    db.commit()
    db.refresh(agent)
    
    return agent

@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    db.delete(agent)
    db.commit()
    
    return None

@router.post("/{agent_id}/duplicate", response_model=AgentResponse)
async def duplicate_agent(
    agent_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    agent = db.query(Agent).filter(Agent.id == agent_id, Agent.user_id == current_user.id).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    new_agent = Agent(
        name=f"{agent.name} (Copy)",
        description=agent.description,
        system_prompt=agent.system_prompt,
        is_public=False,  # Default to private for duplicates
        configuration=agent.configuration,
        user_id=current_user.id
    )
    
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    
    return new_agent
