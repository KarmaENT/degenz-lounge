import os
from typing import Dict, Any, Optional, List
from app.models import User, Subscription, Transaction
from app.database import get_db
from sqlalchemy.orm import Session

class PaymentService:
    """
    Service for handling payment-related operations.
    Provides a unified interface for both PayPal and Stripe payment processing.
    """
    
    def __init__(self, db: Session):
        """
        Initialize the payment service.
        
        Args:
            db: Database session
        """
        self.db = db
    
    async def create_subscription(self, user: User, payment_method: str, 
                                 plan_id: str, return_url: str, cancel_url: str) -> Dict[str, Any]:
        """
        Create a subscription for a user.
        
        Args:
            user: User to create subscription for
            payment_method: Payment method to use (paypal or stripe)
            plan_id: ID of the subscription plan
            return_url: URL to redirect after successful payment
            cancel_url: URL to redirect if payment is cancelled
            
        Returns:
            Dictionary containing subscription details including approval URL
        """
        from app.payment.router import paypal_client, stripe_client
        
        if payment_method.lower() == "paypal":
            subscription = await paypal_client.create_subscription(
                plan_id=plan_id,
                return_url=return_url,
                cancel_url=cancel_url
            )
            
            # Store subscription information in database
            db_subscription = Subscription(
                user_id=user.id,
                provider="paypal",
                subscription_id=subscription["id"],
                plan_id=plan_id,
                status="PENDING",
                created_at=datetime.now(),
                metadata=json.dumps(subscription)
            )
            self.db.add(db_subscription)
            self.db.commit()
            
            return {
                "success": True,
                "subscription_id": subscription["id"],
                "approval_url": next(link["href"] for link in subscription["links"] if link["rel"] == "approve")
            }
        
        elif payment_method.lower() == "stripe":
            subscription = await stripe_client.create_subscription(
                customer_id=user.stripe_customer_id,
                price_id=plan_id,
                return_url=return_url,
                cancel_url=cancel_url
            )
            
            # Store subscription information in database
            db_subscription = Subscription(
                user_id=user.id,
                provider="stripe",
                subscription_id=subscription["id"],
                plan_id=plan_id,
                status="PENDING",
                created_at=datetime.now(),
                metadata=json.dumps(subscription)
            )
            self.db.add(db_subscription)
            self.db.commit()
            
            return {
                "success": True,
                "subscription_id": subscription["id"],
                "checkout_url": subscription["checkout_url"]
            }
        
        else:
            raise ValueError(f"Unsupported payment method: {payment_method}")
    
    async def get_subscriptions(self, user: User) -> List[Dict[str, Any]]:
        """
        Get all subscriptions for a user.
        
        Args:
            user: User to get subscriptions for
            
        Returns:
            List of subscription dictionaries
        """
        from app.payment.router import paypal_client, stripe_client
        
        subscriptions = self.db.query(Subscription).filter(Subscription.user_id == user.id).all()
        
        result = []
        for subscription in subscriptions:
            # Get latest details from payment provider
            try:
                if subscription.provider == "paypal":
                    details = await paypal_client.get_subscription_details(subscription.subscription_id)
                    subscription.status = details["status"]
                    subscription.metadata = json.dumps(details)
                    self.db.commit()
                    
                    result.append({
                        "id": subscription.id,
                        "subscription_id": subscription.subscription_id,
                        "provider": subscription.provider,
                        "plan_id": subscription.plan_id,
                        "status": subscription.status,
                        "created_at": subscription.created_at.isoformat(),
                        "details": details
                    })
                
                elif subscription.provider == "stripe":
                    details = await stripe_client.get_subscription_details(subscription.subscription_id)
                    subscription.status = details["status"]
                    subscription.metadata = json.dumps(details)
                    self.db.commit()
                    
                    result.append({
                        "id": subscription.id,
                        "subscription_id": subscription.subscription_id,
                        "provider": subscription.provider,
                        "plan_id": subscription.plan_id,
                        "status": subscription.status,
                        "created_at": subscription.created_at.isoformat(),
                        "details": details
                    })
            
            except Exception as e:
                # If we can't get latest details, return stored information
                result.append({
                    "id": subscription.id,
                    "subscription_id": subscription.subscription_id,
                    "provider": subscription.provider,
                    "plan_id": subscription.plan_id,
                    "status": subscription.status,
                    "created_at": subscription.created_at.isoformat(),
                    "details": json.loads(subscription.metadata) if subscription.metadata else {}
                })
        
        return result
    
    async def cancel_subscription(self, user: User, subscription_id: str, reason: str) -> Dict[str, Any]:
        """
        Cancel a subscription.
        
        Args:
            user: User who owns the subscription
            subscription_id: ID of the subscription
            reason: Reason for cancellation
            
        Returns:
            Dictionary containing cancellation details
        """
        from app.payment.router import paypal_client, stripe_client
        
        subscription = self.db.query(Subscription).filter(
            Subscription.subscription_id == subscription_id,
            Subscription.user_id == user.id
        ).first()
        
        if not subscription:
            raise ValueError("Subscription not found")
        
        if subscription.provider == "paypal":
            result = await paypal_client.cancel_subscription(subscription_id, reason)
            subscription.status = "CANCELLED"
            self.db.commit()
            return result
        
        elif subscription.provider == "stripe":
            result = await stripe_client.cancel_subscription(subscription_id)
            subscription.status = "CANCELLED"
            self.db.commit()
            return result
        
        else:
            raise ValueError(f"Unsupported payment provider: {subscription.provider}")
    
    async def get_transactions(self, user: User, start_date: Optional[str] = None, 
                              end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get transactions for a user.
        
        Args:
            user: User to get transactions for
            start_date: Start date for transactions (YYYY-MM-DD)
            end_date: End date for transactions (YYYY-MM-DD)
            
        Returns:
            List of transaction dictionaries
        """
        # Set default date range if not provided
        if not start_date:
            start_date = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.now().strftime("%Y-%m-%d")
        
        # Get transactions from database
        transactions = self.db.query(Transaction).filter(
            Transaction.user_id == user.id,
            Transaction.created_at >= datetime.strptime(start_date, "%Y-%m-%d"),
            Transaction.created_at <= datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
        ).all()
        
        result = []
        for transaction in transactions:
            result.append({
                "id": transaction.id,
                "transaction_id": transaction.transaction_id,
                "provider": transaction.provider,
                "amount": transaction.amount,
                "currency": transaction.currency,
                "status": transaction.status,
                "created_at": transaction.created_at.isoformat(),
                "details": json.loads(transaction.metadata) if transaction.metadata else {}
            })
        
        return result
    
    def get_available_payment_methods(self) -> List[Dict[str, Any]]:
        """
        Get available payment methods.
        
        Returns:
            List of payment method dictionaries
        """
        methods = []
        
        # Check if PayPal is configured
        if os.getenv("PAYPAL_CLIENT_ID") and os.getenv("PAYPAL_CLIENT_SECRET"):
            methods.append({
                "id": "paypal",
                "name": "PayPal",
                "description": "Pay with PayPal",
                "enabled": True
            })
        
        # Check if Stripe is configured
        if os.getenv("STRIPE_SECRET_KEY"):
            methods.append({
                "id": "stripe",
                "name": "Stripe",
                "description": "Pay with credit card via Stripe",
                "enabled": True
            })
        
        return methods
