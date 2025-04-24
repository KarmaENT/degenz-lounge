from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any

class AIModelBase(ABC):
    """
    Base abstract class for all AI model integrations.
    All model providers must implement these methods.
    """
    
    @abstractmethod
    async def generate_text(self, prompt: str, system_message: Optional[str] = None, 
                           temperature: float = 0.7, max_tokens: int = 1000, 
                           options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate text based on the provided prompt.
        
        Args:
            prompt: The user prompt to generate text from
            system_message: Optional system message to guide the model's behavior
            temperature: Controls randomness (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            options: Additional model-specific options
            
        Returns:
            Generated text as a string
        """
        pass
    
    @abstractmethod
    async def generate_chat_response(self, messages: List[Dict[str, str]], 
                                    temperature: float = 0.7, max_tokens: int = 1000,
                                    options: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a response based on a conversation history.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content' keys
                     Roles can be 'system', 'user', or 'assistant'
            temperature: Controls randomness (0.0 to 1.0)
            max_tokens: Maximum number of tokens to generate
            options: Additional model-specific options
            
        Returns:
            Generated response as a string
        """
        pass
    
    @abstractmethod
    async def score_conflict_resolution(self, conflict_text: str, resolution_text: str,
                                       options: Optional[Dict[str, Any]] = None) -> float:
        """
        Score a conflict resolution between agents.
        
        Args:
            conflict_text: The text describing the conflict
            resolution_text: The proposed resolution
            options: Additional model-specific options
            
        Returns:
            Score between 0.0 and 1.0 indicating quality of resolution
        """
        pass
    
    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the model.
        
        Returns:
            Dictionary containing model information like name, provider, capabilities, etc.
        """
        pass
