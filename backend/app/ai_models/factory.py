import os
from typing import Dict, List, Optional, Any
from app.ai_models.base import AIModelBase
from app.ai_models.gemini_model import GeminiModel
from app.ai_models.openai_model import OpenAIModel
from app.ai_models.claude_model import ClaudeModel
from app.ai_models.mistral_model import MistralAIModel
from app.ai_models.deepseek_model import DeepSeekModel
from app.ai_models.grok_model import GrokModel
from app.ai_models.huggingface_model import HuggingfaceModel
from app.ai_models.openrouter_model import OpenrouterModel
from app.ai_models.perplexity_model import PerplexityModel

class AIModelFactory:
    """
    Factory class for creating AI model instances.
    """
    
    @staticmethod
    def get_model(provider: str, api_key: Optional[str] = None, model_name: Optional[str] = None) -> AIModelBase:
        """
        Get an AI model instance based on the provider.
        
        Args:
            provider: The AI model provider (gemini, openai, claude, etc.)
            api_key: Optional API key for the provider
            model_name: Optional model name to use
            
        Returns:
            An instance of the requested AI model
            
        Raises:
            ValueError: If the provider is not supported
        """
        provider = provider.lower()
        
        if provider == "gemini":
            return GeminiModel(api_key=api_key, model_name=model_name or "gemini-flash-2.0")
        elif provider == "openai":
            return OpenAIModel(api_key=api_key, model_name=model_name or "gpt-4o")
        elif provider == "claude":
            return ClaudeModel(api_key=api_key, model_name=model_name or "claude-3-opus-20240229")
        elif provider == "mistral" or provider == "mistralai":
            return MistralAIModel(api_key=api_key, model_name=model_name or "mistral-large-latest")
        elif provider == "deepseek":
            return DeepSeekModel(api_key=api_key, model_name=model_name or "deepseek-chat")
        elif provider == "grok":
            return GrokModel(api_key=api_key, model_name=model_name or "grok-1")
        elif provider == "huggingface":
            return HuggingfaceModel(api_key=api_key, model_name=model_name or "meta-llama/Llama-3-70b-chat")
        elif provider == "openrouter":
            return OpenrouterModel(api_key=api_key, model_name=model_name or "openai/gpt-4o")
        elif provider == "perplexity":
            return PerplexityModel(api_key=api_key, model_name=model_name or "sonar-medium-online")
        else:
            raise ValueError(f"Unsupported AI model provider: {provider}")
    
    @staticmethod
    def get_default_model() -> AIModelBase:
        """
        Get the default AI model (Gemini).
        
        Returns:
            An instance of the default AI model
        """
        return GeminiModel()
    
    @staticmethod
    def list_available_models() -> List[Dict[str, Any]]:
        """
        List all available AI models with their information.
        
        Returns:
            A list of dictionaries containing model information
        """
        models = []
        
        # Create temporary instances to get model info
        try:
            models.append(GeminiModel().get_model_info())
        except:
            pass
            
        try:
            models.append(OpenAIModel().get_model_info())
        except:
            pass
            
        try:
            models.append(ClaudeModel().get_model_info())
        except:
            pass
            
        try:
            models.append(MistralAIModel().get_model_info())
        except:
            pass
            
        try:
            models.append(DeepSeekModel().get_model_info())
        except:
            pass
            
        try:
            models.append(GrokModel().get_model_info())
        except:
            pass
            
        try:
            models.append(HuggingfaceModel().get_model_info())
        except:
            pass
            
        try:
            models.append(OpenrouterModel().get_model_info())
        except:
            pass
            
        try:
            models.append(PerplexityModel().get_model_info())
        except:
            pass
        
        return models
