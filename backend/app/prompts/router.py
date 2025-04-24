from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid

from app.database import get_db
from app.models import Prompt
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/prompts", tags=["prompts"])

# Schemas
class PromptBase(BaseModel):
    title: str
    content: str
    description: Optional[str] = None
    tags: List[str] = []
    is_public: bool = False

class PromptCreate(PromptBase):
    pass

class PromptUpdate(PromptBase):
    pass

class PromptResponse(PromptBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: str
    updated_at: str
    
    class Config:
        orm_mode = True

# Routes
@router.get("/", response_model=List[PromptResponse])
async def get_prompts(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    prompts = db.query(Prompt).filter(Prompt.user_id == current_user.id).offset(skip).limit(limit).all()
    return prompts

@router.post("/", response_model=PromptResponse, status_code=status.HTTP_201_CREATED)
async def create_prompt(
    prompt_data: PromptCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    new_prompt = Prompt(
        **prompt_data.dict(),
        user_id=current_user.id
    )
    
    db.add(new_prompt)
    db.commit()
    db.refresh(new_prompt)
    
    return new_prompt

@router.get("/{prompt_id}", response_model=PromptResponse)
async def get_prompt(
    prompt_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id, Prompt.user_id == current_user.id).first()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    return prompt

@router.put("/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: uuid.UUID, 
    prompt_data: PromptUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id, Prompt.user_id == current_user.id).first()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    for key, value in prompt_data.dict().items():
        setattr(prompt, key, value)
    
    db.commit()
    db.refresh(prompt)
    
    return prompt

@router.delete("/{prompt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prompt(
    prompt_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id, Prompt.user_id == current_user.id).first()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    db.delete(prompt)
    db.commit()
    
    return None

@router.post("/{prompt_id}/duplicate", response_model=PromptResponse)
async def duplicate_prompt(
    prompt_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    prompt = db.query(Prompt).filter(Prompt.id == prompt_id, Prompt.user_id == current_user.id).first()
    
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    new_prompt = Prompt(
        title=f"{prompt.title} (Copy)",
        content=prompt.content,
        description=prompt.description,
        tags=prompt.tags,
        is_public=False,  # Default to private for duplicates
        user_id=current_user.id
    )
    
    db.add(new_prompt)
    db.commit()
    db.refresh(new_prompt)
    
    return new_prompt
