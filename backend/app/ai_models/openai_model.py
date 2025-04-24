import os
from typing import Dict, List, Optional, Any
import openai
from app.ai_models.base import AIModelBase

class OpenAIModel(AIModelBase):
    """
    Implementation of the OpenAI model integration.
    """
    
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gpt-4o"):
        """
        Initialize the OpenAI model.
        
        Args:
            api_key: OpenAI API key (defaults to environment variable)
            model_name: OpenAI model name to use
        """
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key is required")
        
        self.model_name = model_name
        self.client = openai.OpenAI(api_key=self.api_key)
    
    async def generate_text(self, prompt: str, system_message: Optional[str] = None, 
                           temperature: float = 0.7, max_tokens: int = 1000, 
                           options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate text using OpenAI model.
        """
        messages = []
        
        if system_message:
            messages.append({"role": "system", "content": system_message})
        
        messages.append({"role": "user", "content": prompt})
        
        params = {
            "model": self.model_name,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        if options:
            params.update(options)
        
        response = self.client.chat.completions.create(**params)
        
        return response.choices[0].message.content
    
    async def generate_chat_response(self, messages: List[Dict[str, str]], 
                                    temperature: float = 0.7, max_tokens: int = 1000,
                                    options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a chat response using OpenAI model.
        """
        # Convert messages to OpenAI format if needed
        openai_messages = []
        
        for message in messages:
            openai_messages.append({
                "role": message["role"],
                "content": message["content"]
            })
        
        params = {
            "model": self.model_name,
            "messages": openai_messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        if options:
            params.update(options)
        
        response = self.client.chat.completions.create(**params)
        
        return response.choices[0].message.content
    
    async def score_conflict_resolution(self, conflict_text: str, resolution_text: str,
                                       options: Optional[Dict[str, Any]] = None) -> float:
        """
        Score a conflict resolution using OpenAI model.
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
            "messages": [
                {"role": "system", "content": "You are an AI evaluator that scores conflict resolutions."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.1,  # Low temperature for more deterministic scoring
            "max_tokens": 10
        }
        
        if options:
            params.update(options)
        
        response = self.client.chat.completions.create(**params)
        
        # Extract the score from the response
        try:
            score_text = response.choices[0].message.content.strip()
            score = float(score_text)
            # Ensure score is between 0.0 and 1.0
            score = max(0.0, min(1.0, score))
            return score
        except ValueError:
            # Default to middle score if parsing fails
            return 0.5
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the OpenAI model.
        """
        return {
            "name": self.model_name,
            "provider": "OpenAI",
            "description": "OpenAI's GPT models for text generation and chat",
            "is_default": False,
            "capabilities": ["text_generation", "chat", "conflict_resolution"],
            "max_tokens": 8192 if "gpt-4" in self.model_name else 4096,
            "supports_system_message": True
        }
