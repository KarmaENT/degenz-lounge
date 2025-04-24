import requests

# API base URL
API_URL = "http://localhost:8000/api"

def list_agents(token):
    """
    Get list of user's agents
    """
    try:
        response = requests.get(
            f"{API_URL}/agents",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return []
    except Exception as e:
        print(f"Error fetching agents: {str(e)}")
        return []

def create_agent(token, name, description, system_prompt, is_public):
    """
    Create a new agent
    """
    try:
        response = requests.post(
            f"{API_URL}/agents",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": name,
                "description": description,
                "system_prompt": system_prompt,
                "is_public": is_public
            }
        )
        
        if response.status_code == 201:
            return {
                "success": True,
                "agent": response.json()
            }
        else:
            return {
                "success": False,
                "message": response.json().get("detail", "Failed to create agent")
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

def view_agent(token, agent_id):
    """
    Get details of a specific agent
    """
    try:
        response = requests.get(
            f"{API_URL}/agents/{agent_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "agent": response.json()
            }
        else:
            return {
                "success": False,
                "message": response.json().get("detail", "Failed to fetch agent")
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }
