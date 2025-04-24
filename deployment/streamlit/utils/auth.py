import requests
import json

# API base URL
API_URL = "http://localhost:8000/api"

def login(email, password):
    """
    Authenticate user and return token
    """
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            json={"email": email, "password": password}
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "success": True,
                "token": data["access_token"],
                "user": data["user"]
            }
        else:
            return {
                "success": False,
                "message": response.json().get("detail", "Login failed")
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

def register(email, password):
    """
    Register a new user
    """
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json={"email": email, "password": password}
        )
        
        if response.status_code == 201:
            return {
                "success": True,
                "message": "Registration successful"
            }
        else:
            return {
                "success": False,
                "message": response.json().get("detail", "Registration failed")
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

def check_auth(token):
    """
    Check if token is valid
    """
    if not token:
        return False
        
    try:
        response = requests.get(
            f"{API_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        return response.status_code == 200
    except:
        return False
