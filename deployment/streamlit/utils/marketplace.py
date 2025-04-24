import requests

# API base URL
API_URL = "http://localhost:8000/api"

def list_marketplace_items(token, item_type=None, tag=None):
    """
    Get list of marketplace items
    """
    try:
        params = {}
        if item_type:
            params['item_type'] = item_type
        if tag:
            params['tag'] = tag
            
        response = requests.get(
            f"{API_URL}/marketplace/listings",
            headers={"Authorization": f"Bearer {token}"},
            params=params
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            return []
    except Exception as e:
        print(f"Error fetching marketplace items: {str(e)}")
        return []

def view_item(token, item_id):
    """
    Get details of a specific marketplace item
    """
    try:
        response = requests.get(
            f"{API_URL}/marketplace/listings/{item_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "item": response.json()
            }
        else:
            return {
                "success": False,
                "message": response.json().get("detail", "Failed to fetch marketplace item")
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

def purchase_item(token, item_id):
    """
    Purchase a marketplace item
    """
    try:
        response = requests.post(
            f"{API_URL}/marketplace/purchase/{item_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            return {
                "success": True,
                "message": "Purchase successful"
            }
        else:
            return {
                "success": False,
                "message": response.json().get("detail", "Failed to purchase item")
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

def create_listing(token, title, description, price, item_type, item_id, tags, preview_data):
    """
    Create a new marketplace listing
    """
    try:
        response = requests.post(
            f"{API_URL}/marketplace/listings",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "title": title,
                "description": description,
                "price": price,
                "item_type": item_type,
                "item_id": item_id,
                "tags": tags,
                "preview_data": preview_data
            }
        )
        
        if response.status_code == 201:
            return {
                "success": True,
                "listing": response.json()
            }
        else:
            return {
                "success": False,
                "message": response.json().get("detail", "Failed to create listing")
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }
