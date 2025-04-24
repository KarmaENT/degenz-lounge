import requests

# API base URL
API_URL = "http://localhost:8000/api"

def list_sessions(token):
    """
    Get list of user's sandbox sessions
    """
    try:
        response = requests.get(
            f"{API_URL}/sandbox/sessions",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return []
    except Exception as e:
        print(f"Error fetching sandbox sessions: {str(e)}")
        return []

def create_session(token, name, configuration):
    """
    Create a new sandbox session
    """
    try:
        response = requests.post(
            f"{API_URL}/sandbox/sessions",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "name": name,
                "configuration": configuration
            }
        )
        
        if response.status_code == 201:
            return {
                "success": True,
                "session": response.json()
            }
        else:
            return {
                "success": False,
                "message": response.json().get("detail", "Failed to create sandbox session")
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

def view_session(token, session_id):
    """
    Get details of a specific sandbox session
    """
    try:
        response = requests.get(
            f"{API_URL}/sandbox/sessions/{session_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "session": response.json()
            }
        else:
            return {
                "success": False,
                "message": response.json().get("detail", "Failed to fetch sandbox session")
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

def get_session_agents(token, session_id):
    """
    Get agents in a sandbox session
    """
    try:
        response = requests.get(
            f"{API_URL}/sandbox/sessions/{session_id}/agents",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return []
    except Exception as e:
        print(f"Error fetching session agents: {str(e)}")
        return []

def get_session_messages(token, session_id):
    """
    Get messages in a sandbox session
    """
    try:
        response = requests.get(
            f"{API_URL}/sandbox/sessions/{session_id}/messages",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return []
    except Exception as e:
        print(f"Error fetching session messages: {str(e)}")
        return []
