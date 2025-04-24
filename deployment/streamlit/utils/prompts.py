import requests

# API base URL
API_URL = "http://localhost:8000/api"

def list_prompts(token):
    """
    Get list of user's prompts
    """
    try:
        response = requests.get(
            f"{API_URL}/prompts",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return []
    except Exception as e:
        print(f"Error fetching prompts: {str(e)}")
        return []

def create_prompt(token, title, content, description, tags, is_public):
    """
    Create a new prompt
    """
    try:
        response = requests.post(
            f"{API_URL}/prompts",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": title,
                "content": content,
                "description": description,
                "tags": tags,
                "is_public": is_public
            }
        )
        
        if response.status_code == 201:
            return {
                "success": True,
                "prompt": response.json()
            }
        else:
            return {
                "success": False,
                "message": response.json().get("detail", "Failed to create prompt")
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

def view_prompt(token, prompt_id):
    """
    Get details of a specific prompt
    """
    try:
        response = requests.get(
            f"{API_URL}/prompts/{prompt_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "prompt": response.json()
            }
        else:
            return {
                "success": False,
                "message": response.json().get("detail", "Failed to fetch prompt")
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }
