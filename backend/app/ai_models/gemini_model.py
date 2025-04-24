import os
import json
from typing import Dict, List, Optional, Any
import google.generativeai as genai
from app.ai_models.base import AIModelBase

class GeminiModel(AIModelBase):
    """
    Implementation of the Gemini AI model integration.
    This is the default model for DeGeNz Lounge.
    """
    
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-flash-2.0"):
        """
        Initialize the Gemini model.
        
        Args:
            api_key: Gemini API key (defaults to environment variable)
            model_name: Gemini model name to use
        """
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("Gemini API key is required")
        
        self.model_name = model_name
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel(self.model_name)
    
    async def generate_text(self, prompt: str, system_message: Optional[str] = None, 
                           temperature: float = 0.7, max_tokens: int = 1000, 
                           options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate text using Gemini model.
        """
        generation_config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
            "top_p": 0.95,
            "top_k": 40,
        }
        
        if options:
            generation_config.update(options)
        
        # Combine system message and prompt if provided
        full_prompt = prompt
        if system_message:
            full_prompt = f"{system_message}\n\n{prompt}"
        
        response = self.model.generate_content(
            full_prompt,
            generation_config=generation_config
        )
        
        return response.text
    
    async def generate_chat_response(self, messages: List[Dict[str, str]], 
                                    temperature: float = 0.7, max_tokens: int = 1000,
                                    options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a chat response using Gemini model.
        """
        generation_config = {
            "temperature": temperature,
            "max_output_tokens": max_tokens,
            "top_p": 0.95,
            "top_k": 40,
        }
        
        if options:
            generation_config.update(options)
        
        # Convert messages to Gemini chat format
        chat = self.model.start_chat(history=[])
        
        # Add messages to chat
        for message in messages:
            role = message["role"]
            content = message["content"]
            
            if role == "system" and len(messages) > 1:
                # For system messages, we'll add them as user messages with a special prefix
                chat.send_message(f"[System Instruction] {content}")
            elif role == "user":
                chat.send_message(content, role="user")
            elif role == "assistant":
                chat.send_message(content, role="model")
        
        # Generate response
        response = chat.send_message(
            messages[-1]["content"] if messages[-1]["role"] == "user" else "Please continue the conversation.",
            generation_config=generation_config
        )
        
        return response.text
    
    async def score_conflict_resolution(self, conflict_text: str, resolution_text: str,
                                       options: Optional[Dict[str, Any]] = None) -> float:
        """
        Score a conflict resolution using Gemini model.
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
        
        generation_config = {
            "temperature": 0.1,  # Low temperature for more deterministic scoring
            "max_output_tokens": 10,
            "top_p": 0.95,
            "top_k": 40,
        }
        
        if options:
            generation_config.update(options)
        
        response = self.model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        # Extract the score from the response
        try:
            score_text = response.text.strip()
            score = float(score_text)
            # Ensure score is between 0.0 and 1.0
            score = max(0.0, min(1.0, score))
            return score
        except ValueError:
            # Default to middle score if parsing fails
            return 0.5
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the Gemini model.
        """
        return {
            "name": self.model_name,
            "provider": "Google",
            "description": "Google's Gemini model for text generation and chat",
            "is_default": True,
            "capabilities": ["text_generation", "chat", "conflict_resolution"],
            "max_tokens": 8192,
            "supports_system_message": True
        }
