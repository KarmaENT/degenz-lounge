from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from pydantic import BaseModel
import uuid
import json
import asyncio
from datetime import datetime

from app.database import get_db
from app.models import ChatMessage, SandboxSession, SandboxAgent, Agent
from app.auth.dependencies import get_current_active_user

router = APIRouter(prefix="/chat", tags=["chat"])

# Schemas
class MessageBase(BaseModel):
    content: str
    metadata: dict = {}

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: uuid.UUID
    session_id: uuid.UUID
    sender_type: str
    sender_id: str
    created_at: str
    
    class Config:
        orm_mode = True

class ConflictResolution(BaseModel):
    message_id: uuid.UUID
    resolution: str
    score: float

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, session_id: str, user_id: str):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)

    def disconnect(self, websocket: WebSocket, session_id: str):
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]

    async def send_message(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                await connection.send_json(message)

    async def broadcast_conflict_resolution(self, conflict: dict, session_id: str):
        if session_id in self.active_connections:
            for connection in self.active_connections[session_id]:
                await connection.send_json({
                    "type": "conflict_resolution",
                    "data": conflict
                })

manager = ConnectionManager()

# Routes
@router.get("/{session_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    session_id: uuid.UUID, 
    skip: int = 0, 
    limit: int = 100, 
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
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id
    ).order_by(ChatMessage.created_at).offset(skip).limit(limit).all()
    
    return messages

@router.post("/{session_id}/messages", response_model=MessageResponse)
async def create_message(
    session_id: uuid.UUID, 
    message_data: MessageCreate, 
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
    
    # Create user message
    new_message = ChatMessage(
        session_id=session_id,
        sender_type="user",
        sender_id=str(current_user.id),
        content=message_data.content,
        metadata=message_data.metadata
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Broadcast message to all connected clients
    message_dict = {
        "id": str(new_message.id),
        "session_id": str(new_message.session_id),
        "sender_type": new_message.sender_type,
        "sender_id": new_message.sender_id,
        "content": new_message.content,
        "created_at": new_message.created_at.isoformat(),
        "metadata": new_message.metadata
    }
    
    # This would be handled by WebSocket in a real implementation
    # await manager.send_message({"type": "message", "data": message_dict}, str(session_id))
    
    # In a real implementation, we would trigger agent responses here
    # This would involve:
    # 1. Getting all agents in the sandbox
    # 2. For each agent, generating a response using LangChain
    # 3. If there are conflicts, using Gemini to score and resolve them
    # 4. Saving and broadcasting the agent responses
    
    return new_message

@router.websocket("/{session_id}/stream")
async def websocket_endpoint(
    websocket: WebSocket, 
    session_id: str, 
    token: str,
    db: Session = Depends(get_db)
):
    # In a real implementation, we would validate the token
    # and get the user_id from it
    user_id = "mock_user_id"
    
    # Connect to WebSocket
    await manager.connect(websocket, session_id, user_id)
    
    try:
        while True:
            # Receive message from WebSocket
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Process message
            if message_data["type"] == "message":
                # Create message in database
                new_message = ChatMessage(
                    session_id=uuid.UUID(session_id),
                    sender_type="user",
                    sender_id=user_id,
                    content=message_data["content"],
                    metadata=message_data.get("metadata", {})
                )
                
                db.add(new_message)
                db.commit()
                db.refresh(new_message)
                
                # Broadcast message to all connected clients
                await manager.send_message({
                    "type": "message",
                    "data": {
                        "id": str(new_message.id),
                        "session_id": session_id,
                        "sender_type": new_message.sender_type,
                        "sender_id": new_message.sender_id,
                        "content": new_message.content,
                        "created_at": new_message.created_at.isoformat(),
                        "metadata": new_message.metadata
                    }
                }, session_id)
                
                # In a real implementation, we would trigger agent responses here
                # This would involve:
                # 1. Getting all agents in the sandbox
                # 2. For each agent, generating a response using LangChain
                # 3. If there are conflicts, using Gemini to score and resolve them
                # 4. Broadcasting the agent responses
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, session_id)

# Conflict resolution module
class ConflictResolver:
    @staticmethod
    async def resolve_conflicts(messages: List[dict], db: Session):
        """
        Resolve conflicts between agent messages using Gemini.
        
        In a real implementation, this would:
        1. Identify conflicting messages
        2. Use Gemini to score each message
        3. Select the highest-scoring message or combine them
        4. Return the resolution
        """
        # Mock implementation
        if len(messages) <= 1:
            return None
        
        # Simulate Gemini scoring
        scores = {msg["id"]: 0.5 + (i * 0.1) for i, msg in enumerate(messages)}
        
        # Find highest scoring message
        best_message_id = max(scores, key=scores.get)
        best_score = scores[best_message_id]
        
        # Create resolution
        resolution = {
            "message_id": best_message_id,
            "resolution": "Selected based on relevance and accuracy",
            "score": best_score,
            "alternatives": [
                {"message_id": msg["id"], "score": scores[msg["id"]]}
                for msg in messages if msg["id"] != best_message_id
            ]
        }
        
        return resolution
