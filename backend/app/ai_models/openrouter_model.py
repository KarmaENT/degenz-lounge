import os
from typing import Dict, List, Optional, Any
import requests
from app.ai_models.base import AIModelBase

class OpenrouterModel(AIModelBase):
    """
    Implementation of the Openrouter model integration.
    Openrouter provides access to multiple AI models through a single API.
    """
    
    def __init__(self, api_key: Optional[str] = None, model_name: str = "openai/gpt-4o"):
        """
        Initialize the Openrouter model.
        
        Args:
            api_key: Openrouter API key (defaults to environment variable)
            model_name: Model name to use through Openrouter (provider/model format)
        """
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError("Openrouter API key is required")
        
        self.model_name = model_name
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://degenz-lounge.com",  # Required by Openrouter
            "X-Title": "DeGeNz Lounge"  # Required by Openrouter
        }
    
    async def generate_text(self, prompt: str, system_message: Optional[str] = None, 
                           temperature: float = 0.7, max_tokens: int = 1000, 
                           options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate text using Openrouter model.
        """
        messages = []
        
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        messages.append({"role": "user", "content": prompt})
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        if options:
            payload.update(options)
        
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        return response.json()["choices"][0]["message"]["content"]
    
    async def generate_chat_response(self, messages: List[Dict[str, str]], 
                                    temperature: float = 0.7, max_tokens: int = 1000,
                                    options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a chat response using Openrouter model.
        """
        # Convert messages to Openrouter format if needed
        openrouter_messages = []
        
        for message in messages:
            openrouter_messages.append({
                "role": message["role"],
                "content": message["content"]
            })
        
        payload = {
            "model": self.model_name,
            "messages": openrouter_messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        if options:
            payload.update(options)
        
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        return response.json()["choices"][0]["message"]["content"]
    
    async def score_conflict_resolution(self, conflict_text: str, resolution_text: str,
                                       options: Optional[Dict[str, Any]] = None) -> float:
        """
        Score a conflict resolution using Openrouter model.
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
        
        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": "You are an AI evaluator that scores conflict resolutions."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,  # Low temperature for more deterministic scoring
            "max_tokens": 10
        }
        
        if options:
            payload.update(options)
        
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        # Extract the score from the response
        try:
            score_text = response.json()["choices"][0]["message"]["content"].strip()
            score = float(score_text)
            # Ensure score is between 0.0 and 1.0
            score = max(0.0, min(1.0, score))
            return score
        except ValueError:
            # Default to middle score if parsing fails
            return 0.5
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the Openrouter model.
        """
        return {
            "name": self.model_name,
            "provider": "Openrouter",
            "description": "Openrouter provides access to multiple AI models through a single API",
            "is_default": False,
            "capabilities": ["text_generation", "chat", "conflict_resolution"],
            "max_tokens": 8192,  # This varies by the underlying model
            "supports_system_message": True
        }
