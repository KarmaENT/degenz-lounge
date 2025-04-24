import os
from typing import Dict, List, Optional, Any
import requests
from app.ai_models.base import AIModelBase

class HuggingfaceModel(AIModelBase):
    """
    Implementation of the Huggingface model integration.
    """
    
    def __init__(self, api_key: Optional[str] = None, model_name: str = "meta-llama/Llama-3-70b-chat"):
        """
        Initialize the Huggingface model.
        
        Args:
            api_key: Huggingface API key (defaults to environment variable)
            model_name: Huggingface model name to use
        """
        self.api_key = api_key or os.getenv("HUGGINGFACE_API_KEY")
        if not self.api_key:
            raise ValueError("Huggingface API key is required")
        
        self.model_name = model_name
        self.api_url = f"https://api-inference.huggingface.co/models/{model_name}"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    async def generate_text(self, prompt: str, system_message: Optional[str] = None, 
                           temperature: float = 0.7, max_tokens: int = 1000, 
                           options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate text using Huggingface model.
        """
        full_prompt = prompt
        if system_message:
            full_prompt = f"{system_message}\n\n{prompt}"
            
        payload = {
            "inputs": full_prompt,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens,
                "return_full_text": False
            }
        }
        
        if options and "parameters" in options:
            payload["parameters"].update(options["parameters"])
        
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        # Handle different response formats from Huggingface
        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            if "generated_text" in result[0]:
                return result[0]["generated_text"]
            else:
                return str(result[0])
        elif isinstance(result, dict) and "generated_text" in result:
            return result["generated_text"]
        else:
            return str(result)
    
    async def generate_chat_response(self, messages: List[Dict[str, str]], 
                                    temperature: float = 0.7, max_tokens: int = 1000,
                                    options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a chat response using Huggingface model.
        """
        # Convert messages to a format suitable for Huggingface
        conversation = ""
        system_message = None
        
        for message in messages:
            role = message["role"]
            content = message["content"]
            
            if role == "system":
                system_message = content
            elif role == "user":
                conversation += f"User: {content}\n"
            elif role == "assistant":
                conversation += f"Assistant: {content}\n"
        
        # Add system message at the beginning if present
        if system_message:
            conversation = f"System: {system_message}\n{conversation}"
            
        # Add final prompt for assistant response
        conversation += "Assistant: "
        
        payload = {
            "inputs": conversation,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens,
                "return_full_text": False
            }
        }
        
        if options and "parameters" in options:
            payload["parameters"].update(options["parameters"])
        
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        # Handle different response formats from Huggingface
        result = response.json()
        if isinstance(result, list) and len(result) > 0:
            if "generated_text" in result[0]:
                return result[0]["generated_text"]
            else:
                return str(result[0])
        elif isinstance(result, dict) and "generated_text" in result:
            return result["generated_text"]
        else:
            return str(result)
    
    async def score_conflict_resolution(self, conflict_text: str, resolution_text: str,
                                       options: Optional[Dict[str, Any]] = None) -> float:
        """
        Score a conflict resolution using Huggingface model.
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
            "inputs": prompt,
            "parameters": {
                "temperature": 0.1,  # Low temperature for more deterministic scoring
                "max_new_tokens": 10,
                "return_full_text": False
            }
        }
        
        if options and "parameters" in options:
            payload["parameters"].update(options["parameters"])
        
        response = requests.post(self.api_url, headers=self.headers, json=payload)
        response.raise_for_status()
        
        # Extract the score from the response
        result = response.json()
        response_text = ""
        
        if isinstance(result, list) and len(result) > 0:
            if "generated_text" in result[0]:
                response_text = result[0]["generated_text"]
            else:
                response_text = str(result[0])
        elif isinstance(result, dict) and "generated_text" in result:
            response_text = result["generated_text"]
        else:
            response_text = str(result)
            
        # Try to extract a float from the response
        try:
            # Find the first float-like string in the response
            import re
            float_matches = re.findall(r"[0-9]*\.?[0-9]+", response_text)
            if float_matches:
                score = float(float_matches[0])
                # Ensure score is between 0.0 and 1.0
                score = max(0.0, min(1.0, score))
                return score
            else:
                return 0.5  # Default to middle score if no float found
        except ValueError:
            # Default to middle score if parsing fails
            return 0.5
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the Huggingface model.
        """
        return {
            "name": self.model_name,
            "provider": "Huggingface",
            "description": "Huggingface's hosted models for text generation and chat",
            "is_default": False,
            "capabilities": ["text_generation", "chat", "conflict_resolution"],
            "max_tokens": 4096,  # This varies by model
            "supports_system_message": True
        }
