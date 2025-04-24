import os
from typing import Dict, Any, Optional, List
import requests
import json
import time
from datetime import datetime, timedelta

class PayPalClient:
    """
    Client for interacting with PayPal API for payment processing.
    """
    
    def __init__(self, client_id: Optional[str] = None, client_secret: Optional[str] = None, sandbox: bool = False):
        """
        Initialize the PayPal client.
        
        Args:
            client_id: PayPal client ID (defaults to environment variable)
            client_secret: PayPal client secret (defaults to environment variable)
            sandbox: Whether to use PayPal sandbox environment
        """
        self.client_id = client_id or os.getenv("PAYPAL_CLIENT_ID")
        self.client_secret = client_secret or os.getenv("PAYPAL_CLIENT_SECRET")
        
        if not self.client_id or not self.client_secret:
            raise ValueError("PayPal client ID and client secret are required")
        
        self.sandbox = sandbox
        self.base_url = "https://api-m.sandbox.paypal.com" if sandbox else "https://api-m.paypal.com"
        self.access_token = None
        self.token_expiry = None
    
    async def get_access_token(self) -> str:
        """
        Get an access token for PayPal API.
        
        Returns:
            Access token string
        """
        # Check if we have a valid token
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
        
        # Get a new token
        auth_url = f"{self.base_url}/v1/oauth2/token"
        headers = {
            "Accept": "application/json",
            "Accept-Language": "en_US"
        }
        data = {
            "grant_type": "client_credentials"
        }
        
        response = requests.post(
            auth_url,
            auth=(self.client_id, self.client_secret),
            headers=headers,
            data=data
        )
        response.raise_for_status()
        
        token_data = response.json()
        self.access_token = token_data["access_token"]
        # Set token expiry with a small buffer
        self.token_expiry = datetime.now() + timedelta(seconds=token_data["expires_in"] - 60)
        
        return self.access_token
    
    async def create_subscription_plan(self, name: str, description: str, amount: float, 
                                      currency: str = "USD", interval: str = "MONTH") -> Dict[str, Any]:
        """
        Create a subscription plan in PayPal.
        
        Args:
            name: Name of the subscription plan
            description: Description of the subscription plan
            amount: Amount to charge for the subscription
            currency: Currency code (default: USD)
            interval: Billing interval (MONTH, YEAR)
            
        Returns:
            Dictionary containing plan details including ID
        """
        token = await self.get_access_token()
        
        plan_url = f"{self.base_url}/v1/billing/plans"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        # First create a product
        product_url = f"{self.base_url}/v1/catalogs/products"
        product_data = {
            "name": name,
            "description": description,
            "type": "SERVICE",
            "category": "SOFTWARE"
        }
        
        product_response = requests.post(
            product_url,
            headers=headers,
            json=product_data
        )
        product_response.raise_for_status()
        
        product_id = product_response.json()["id"]
        
        # Now create the plan
        plan_data = {
            "product_id": product_id,
            "name": name,
            "description": description,
            "billing_cycles": [
                {
                    "frequency": {
                        "interval_unit": interval,
                        "interval_count": 1
                    },
                    "tenure_type": "REGULAR",
                    "sequence": 1,
                    "total_cycles": 0,  # Infinite
                    "pricing_scheme": {
                        "fixed_price": {
                            "value": str(amount),
                            "currency_code": currency
                        }
                    }
                }
            ],
            "payment_preferences": {
                "auto_bill_outstanding": True,
                "setup_fee": {
                    "value": "0",
                    "currency_code": currency
                },
                "setup_fee_failure_action": "CONTINUE",
                "payment_failure_threshold": 3
            }
        }
        
        plan_response = requests.post(
            plan_url,
            headers=headers,
            json=plan_data
        )
        plan_response.raise_for_status()
        
        return plan_response.json()
    
    async def create_subscription(self, plan_id: str, return_url: str, cancel_url: str) -> Dict[str, Any]:
        """
        Create a subscription for a customer.
        
        Args:
            plan_id: ID of the subscription plan
            return_url: URL to redirect after successful payment
            cancel_url: URL to redirect if payment is cancelled
            
        Returns:
            Dictionary containing subscription details including approval URL
        """
        token = await self.get_access_token()
        
        subscription_url = f"{self.base_url}/v1/billing/subscriptions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        subscription_data = {
            "plan_id": plan_id,
            "application_context": {
                "brand_name": "DeGeNz Lounge",
                "locale": "en-US",
                "shipping_preference": "NO_SHIPPING",
                "user_action": "SUBSCRIBE_NOW",
                "payment_method": {
                    "payer_selected": "PAYPAL",
                    "payee_preferred": "IMMEDIATE_PAYMENT_REQUIRED"
                },
                "return_url": return_url,
                "cancel_url": cancel_url
            }
        }
        
        subscription_response = requests.post(
            subscription_url,
            headers=headers,
            json=subscription_data
        )
        subscription_response.raise_for_status()
        
        return subscription_response.json()
    
    async def get_subscription_details(self, subscription_id: str) -> Dict[str, Any]:
        """
        Get details of a subscription.
        
        Args:
            subscription_id: ID of the subscription
            
        Returns:
            Dictionary containing subscription details
        """
        token = await self.get_access_token()
        
        subscription_url = f"{self.base_url}/v1/billing/subscriptions/{subscription_id}"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        subscription_response = requests.get(
            subscription_url,
            headers=headers
        )
        subscription_response.raise_for_status()
        
        return subscription_response.json()
    
    async def cancel_subscription(self, subscription_id: str, reason: str) -> Dict[str, Any]:
        """
        Cancel a subscription.
        
        Args:
            subscription_id: ID of the subscription
            reason: Reason for cancellation
            
        Returns:
            Dictionary containing cancellation details
        """
        token = await self.get_access_token()
        
        subscription_url = f"{self.base_url}/v1/billing/subscriptions/{subscription_id}/cancel"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        cancel_data = {
            "reason": reason
        }
        
        cancel_response = requests.post(
            subscription_url,
            headers=headers,
            json=cancel_data
        )
        cancel_response.raise_for_status()
        
        return {"success": True, "subscription_id": subscription_id}
    
    async def list_transactions(self, subscription_id: str, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        List transactions for a subscription.
        
        Args:
            subscription_id: ID of the subscription
            start_date: Start date for transactions (YYYY-MM-DD)
            end_date: End date for transactions (YYYY-MM-DD)
            
        Returns:
            List of transaction dictionaries
        """
        token = await self.get_access_token()
        
        transactions_url = f"{self.base_url}/v1/billing/subscriptions/{subscription_id}/transactions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        params = {
            "start_time": f"{start_date}T00:00:00Z",
            "end_time": f"{end_date}T23:59:59Z"
        }
        
        transactions_response = requests.get(
            transactions_url,
            headers=headers,
            params=params
        )
        transactions_response.raise_for_status()
        
        return transactions_response.json().get("transactions", [])
    
    async def verify_webhook_signature(self, webhook_id: str, event_body: str, 
                                      headers: Dict[str, str]) -> bool:
        """
        Verify PayPal webhook signature.
        
        Args:
            webhook_id: ID of the webhook
            event_body: Raw event body as string
            headers: Request headers including PayPal signature
            
        Returns:
            Boolean indicating if signature is valid
        """
        token = await self.get_access_token()
        
        verify_url = f"{self.base_url}/v1/notifications/verify-webhook-signature"
        headers_auth = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        
        verify_data = {
            "webhook_id": webhook_id,
            "webhook_event": json.loads(event_body),
            "cert_url": headers.get("Paypal-Cert-Url"),
            "transmission_id": headers.get("Paypal-Transmission-Id"),
            "transmission_time": headers.get("Paypal-Transmission-Time"),
            "transmission_sig": headers.get("Paypal-Transmission-Sig"),
            "auth_algo": headers.get("Paypal-Auth-Algo")
        }
        
        verify_response = requests.post(
            verify_url,
            headers=headers_auth,
            json=verify_data
        )
        verify_response.raise_for_status()
        
        verification_status = verify_response.json().get("verification_status")
        return verification_status == "SUCCESS"
