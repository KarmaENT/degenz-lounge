# DeGeNz Lounge AI Model Integration

This document provides an overview of the AI model integrations available in DeGeNz Lounge.

## Supported AI Models

DeGeNz Lounge supports the following AI models:

1. **Gemini (Default)** - Google's Gemini models, with gemini-flash-2.0 as the default
2. **OpenAI** - OpenAI's GPT models, including GPT-4o
3. **Claude** - Anthropic's Claude models, including Claude 3 Opus
4. **MistralAI** - Mistral's language models, including Mistral Large
5. **DeepSeek** - DeepSeek's language models
6. **Grok** - xAI's Grok model
7. **Huggingface** - Models hosted on Huggingface, including Llama 3
8. **Openrouter** - Access to multiple AI models through a single API
9. **Perplexity** - Perplexity's AI models with online search capabilities

## Configuration

Each AI model requires an API key to be configured. API keys can be set in the environment variables or provided directly when creating model instances.

### Environment Variables

```
# Gemini (Default)
GEMINI_API_KEY=your_gemini_api_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Claude
ANTHROPIC_API_KEY=your_anthropic_api_key

# MistralAI
MISTRAL_API_KEY=your_mistral_api_key

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_api_key

# Grok
GROK_API_KEY=your_grok_api_key

# Huggingface
HUGGINGFACE_API_KEY=your_huggingface_api_key

# Openrouter
OPENROUTER_API_KEY=your_openrouter_api_key

# Perplexity
PERPLEXITY_API_KEY=your_perplexity_api_key
```

## Usage

### Backend Usage

The AI models can be accessed through the `AIModelFactory` class:

```python
from app.ai_models.factory import AIModelFactory

# Get the default model (Gemini)
default_model = AIModelFactory.get_default_model()

# Get a specific model
openai_model = AIModelFactory.get_model("openai")
claude_model = AIModelFactory.get_model("claude")

# Get a model with a specific API key
custom_model = AIModelFactory.get_model("mistral", api_key="your_api_key")

# Get a model with a specific model name
specific_model = AIModelFactory.get_model("huggingface", model_name="meta-llama/Llama-3-70b-chat")

# List all available models
available_models = AIModelFactory.list_available_models()
```

### Frontend Usage

The frontend provides a model selection interface in the sandbox environment. Users can select their preferred AI model from the dropdown menu.

## Model Capabilities

All integrated models support the following capabilities:

1. **Text Generation** - Generate text based on a prompt
2. **Chat** - Generate responses in a conversation
3. **Conflict Resolution** - Score and resolve conflicts between agents

Some models may have additional capabilities, such as online search (Perplexity).

## Default Model

Gemini (gemini-flash-2.0) is the default model used by DeGeNz Lounge. This can be changed in the application settings.

## Adding New Models

To add a new AI model integration:

1. Create a new class that inherits from `AIModelBase`
2. Implement all required methods
3. Add the model to the `AIModelFactory` class

## Performance Considerations

Different models have different performance characteristics, token limits, and pricing. Consider these factors when selecting a model for your use case.

## Error Handling

All model integrations include error handling for common issues such as API key validation, rate limiting, and network errors. Errors are logged and reported to the user interface.
