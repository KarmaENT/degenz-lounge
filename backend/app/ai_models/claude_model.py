import os
from typing import Dict, List, Optional, Any
import anthropic
from app.ai_models.base import AIModelBase

class ClaudeModel(AIModelBase):
    """
    Implementation of the Anthropic Claude model integration.
    """
    
    def __init__(self, api_key: Optional[str] = None, model_name: str = "claude-3-opus-20240229"):
        """
        Initialize the Claude model.
        
        Args:
            api_key: Anthropic API key (defaults to environment variable)
            model_name: Claude model name to use
        """
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key is required")
        
        self.model_name = model_name
        self.client = anthropic.Anthropic(api_key=self.api_key)
    
    async def generate_text(self, prompt: str, system_message: Optional[str] = None, 
                           temperature: float = 0.7, max_tokens: int = 1000, 
                           options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate text using Claude model.
        """
        params = {
            "model": self.model_name,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        if system_message:
            params["system"] = system_message
        
        if options:
            params.update(options)
        
        response = self.client.messages.create(**params)
        
        return response.content[0].text
    
    async def generate_chat_response(self, messages: List[Dict[str, str]], 
                                    temperature: float = 0.7, max_tokens: int = 1000,
                                    options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a chat response using Claude model.
        """
        # Convert messages to Claude format
        claude_messages = []
        system_message = None
        
        for message in messages:
            role = message["role"]
            content = message["content"]
            
            if role == "system":
                system_message = content
            elif role == "user":
                claude_messages.append({"role": "user", "content": content})
            elif role == "assistant":
                claude_messages.append({"role": "assistant", "content": content})
        
        params = {
            "model": self.model_name,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": claude_messages
        }
        
        if system_message:
            params["system"] = system_message
        
        if options:
            params.update(options)
        
        response = self.client.messages.create(**params)
        
        return response.content[0].text
    
    async def score_conflict_resolution(self, conflict_text: str, resolution_text: str,
                                       options: Optional[Dict[str, Any]] = None) -> float:
        """
        Score a conflict resolution using Claude model.
        """
        prompt = f"""
        You are evaluating the quality of a conflict resolution between AI agents.
        
        Conflict:
        {conflict_text}
        
        Proposed Resolution:
        {resolution_text}
        
        Please evaluate the resolution on a scale from 0.0 to 1.0, where:
        - 0.0 means the resolution completely fails to address the conflict
        - 1.0 means the resolution perfectly addresses the conflict
        
        Return only a single number between 0.0 and 1.0.
        """
        
        params = {
            "model": self.model_name,
            "max_tokens": 10,
            "temperature": 0.1,  # Low temperature for more deterministic scoring
            "system": "You are an AI evaluator that scores conflict resolutions.",
            "messages": [
                {"role": "user", "content": prompt}
            ]
        }
        
        if options:
            params.update(options)
        
        response = self.client.messages.create(**params)
        
        # Extract the score from the response
        try:
            score_text = response.content[0].text.strip()
            score = float(score_text)
            # Ensure score is between 0.0 and 1.0
            score = max(0.0, min(1.0, score))
            return score
        except ValueError:
            # Default to middle score if parsing fails
            return 0.5
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the Claude model.
        """
        return {
            "name": self.model_name,
            "provider": "Anthropic",
            "description": "Anthropic's Claude model for text generation and chat",
            "is_default": False,
            "capabilities": ["text_generation", "chat", "conflict_resolution"],
            "max_tokens": 100000,  # Claude 3 Opus has a very large context window
            "supports_system_message": True
        }
