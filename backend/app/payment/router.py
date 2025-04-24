from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
import json
import os
from datetime import datetime, timedelta

from app.auth.dependencies import get_current_user
from app.models import User, Subscription, Transaction
from app.database import get_db
from app.payment.paypal_client import PayPalClient
from app.payment.stripe_client import StripeClient

router = APIRouter(
    prefix="/api/payment",
    tags=["payment"]
)

# Initialize payment clients
paypal_client = PayPalClient(
    client_id=os.getenv("PAYPAL_CLIENT_ID"),
    client_secret=os.getenv("PAYPAL_CLIENT_SECRET"),
    sandbox=os.getenv("PAYPAL_SANDBOX", "true").lower() == "true"
)

stripe_client = StripeClient(
    api_key=os.getenv("STRIPE_SECRET_KEY"),
    webhook_secret=os.getenv("STRIPE_WEBHOOK_SECRET")
)

@router.post("/create-subscription")
async def create_subscription(
    payment_method: str,
    plan_id: str,
    return_url: str,
    cancel_url: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Create a subscription for the current user.
    
    Args:
        payment_method: Payment method to use (paypal or stripe)
        plan_id: ID of the subscription plan
        return_url: URL to redirect after successful payment
        cancel_url: URL to redirect if payment is cancelled
        
    Returns:
        Dictionary containing subscription details including approval URL
    """
    if payment_method.lower() == "paypal":
        try:
            subscription = await paypal_client.create_subscription(
                plan_id=plan_id,
                return_url=return_url,
                cancel_url=cancel_url
            )
            
            # Store subscription information in database
            db_subscription = Subscription(
                user_id=current_user.id,
                provider="paypal",
                subscription_id=subscription["id"],
                plan_id=plan_id,
                status="PENDING",
                created_at=datetime.now(),
                metadata=json.dumps(subscription)
            )
            db.add(db_subscription)
            db.commit()
            
            return {
                "success": True,
                "subscription_id": subscription["id"],
                "approval_url": next(link["href"] for link in subscription["links"] if link["rel"] == "approve")
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to create PayPal subscription: {str(e)}")
    
    elif payment_method.lower() == "stripe":
        try:
            subscription = await stripe_client.create_subscription(
                customer_id=current_user.stripe_customer_id,
                price_id=plan_id,
                return_url=return_url,
                cancel_url=cancel_url
            )
            
            # Store subscription information in database
            db_subscription = Subscription(
                user_id=current_user.id,
                provider="stripe",
                subscription_id=subscription["id"],
                plan_id=plan_id,
                status="PENDING",
                created_at=datetime.now(),
                metadata=json.dumps(subscription)
            )
            db.add(db_subscription)
            db.commit()
            
            return {
                "success": True,
                "subscription_id": subscription["id"],
                "checkout_url": subscription["checkout_url"]
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to create Stripe subscription: {str(e)}")
    
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported payment method: {payment_method}")

@router.get("/subscriptions")
async def get_subscriptions(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get all subscriptions for the current user.
    
    Returns:
        List of subscription dictionaries
    """
    subscriptions = db.query(Subscription).filter(Subscription.user_id == current_user.id).all()
    
    result = []
    for subscription in subscriptions:
        # Get latest details from payment provider
        try:
            if subscription.provider == "paypal":
                details = await paypal_client.get_subscription_details(subscription.subscription_id)
                subscription.status = details["status"]
                subscription.metadata = json.dumps(details)
                db.commit()
                
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
                db.commit()
                
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

@router.post("/cancel-subscription/{subscription_id}")
async def cancel_subscription(
    subscription_id: str,
    reason: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Cancel a subscription.
    
    Args:
        subscription_id: ID of the subscription
        reason: Reason for cancellation
        
    Returns:
        Dictionary containing cancellation details
    """
    subscription = db.query(Subscription).filter(
        Subscription.subscription_id == subscription_id,
        Subscription.user_id == current_user.id
    ).first()
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    try:
        if subscription.provider == "paypal":
            result = await paypal_client.cancel_subscription(subscription_id, reason)
            subscription.status = "CANCELLED"
            db.commit()
            return result
        
        elif subscription.provider == "stripe":
            result = await stripe_client.cancel_subscription(subscription_id)
            subscription.status = "CANCELLED"
            db.commit()
            return result
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported payment provider: {subscription.provider}")
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to cancel subscription: {str(e)}")

@router.get("/transactions")
async def get_transactions(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get transactions for the current user.
    
    Args:
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
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
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

@router.post("/webhook/paypal")
async def paypal_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    """
    Handle PayPal webhook events.
    """
    # Get the raw request body
    body = await request.body()
    body_str = body.decode("utf-8")
    
    # Get headers for signature verification
    headers = dict(request.headers)
    
    # Verify webhook signature
    webhook_id = os.getenv("PAYPAL_WEBHOOK_ID")
    if not webhook_id:
        return JSONResponse(status_code=500, content={"error": "PayPal webhook ID not configured"})
    
    try:
        is_valid = await paypal_client.verify_webhook_signature(webhook_id, body_str, headers)
        if not is_valid:
            return JSONResponse(status_code=400, content={"error": "Invalid webhook signature"})
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": f"Failed to verify webhook signature: {str(e)}"})
    
    # Parse the event
    event_data = json.loads(body_str)
    event_type = event_data.get("event_type")
    
    # Process the event in the background
    background_tasks.add_task(process_paypal_event, event_data, db)
    
    return {"status": "success", "event_type": event_type}

@router.post("/webhook/stripe")
async def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db = Depends(get_db)
):
    """
    Handle Stripe webhook events.
    """
    # Get the raw request body
    body = await request.body()
    body_str = body.decode("utf-8")
    
    # Get Stripe signature from headers
    signature = request.headers.get("Stripe-Signature")
    
    # Verify webhook signature
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        return JSONResponse(status_code=500, content={"error": "Stripe webhook secret not configured"})
    
    try:
        event_data = stripe_client.construct_event(body_str, signature, webhook_secret)
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": f"Failed to verify webhook signature: {str(e)}"})
    
    # Process the event in the background
    background_tasks.add_task(process_stripe_event, event_data, db)
    
    return {"status": "success", "event_type": event_data.get("type")}

async def process_paypal_event(event_data: Dict[str, Any], db):
    """
    Process PayPal webhook event.
    """
    event_type = event_data.get("event_type")
    resource = event_data.get("resource", {})
    
    if event_type == "BILLING.SUBSCRIPTION.CREATED":
        # Subscription created
        subscription_id = resource.get("id")
        subscription = db.query(Subscription).filter(Subscription.subscription_id == subscription_id).first()
        
        if subscription:
            subscription.status = resource.get("status")
            subscription.metadata = json.dumps(resource)
            db.commit()
    
    elif event_type == "BILLING.SUBSCRIPTION.ACTIVATED":
        # Subscription activated
        subscription_id = resource.get("id")
        subscription = db.query(Subscription).filter(Subscription.subscription_id == subscription_id).first()
        
        if subscription:
            subscription.status = resource.get("status")
            subscription.metadata = json.dumps(resource)
            db.commit()
    
    elif event_type == "BILLING.SUBSCRIPTION.CANCELLED":
        # Subscription cancelled
        subscription_id = resource.get("id")
        subscription = db.query(Subscription).filter(Subscription.subscription_id == subscription_id).first()
        
        if subscription:
            subscription.status = resource.get("status")
            subscription.metadata = json.dumps(resource)
            db.commit()
    
    elif event_type == "PAYMENT.SALE.COMPLETED":
        # Payment completed
        transaction_id = resource.get("id")
        
        # Check if transaction already exists
        existing_transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
        if existing_transaction:
            return
        
        # Find the subscription this payment belongs to
        billing_agreement_id = resource.get("billing_agreement_id")
        subscription = db.query(Subscription).filter(Subscription.subscription_id == billing_agreement_id).first()
        
        if subscription:
            # Create a new transaction
            transaction = Transaction(
                user_id=subscription.user_id,
                subscription_id=subscription.id,
                transaction_id=transaction_id,
                provider="paypal",
                amount=float(resource.get("amount", {}).get("total", 0)),
                currency=resource.get("amount", {}).get("currency", "USD"),
                status=resource.get("state"),
                created_at=datetime.now(),
                metadata=json.dumps(resource)
            )
            db.add(transaction)
            db.commit()

async def process_stripe_event(event_data: Dict[str, Any], db):
    """
    Process Stripe webhook event.
    """
    event_type = event_data.get("type")
    object_data = event_data.get("data", {}).get("object", {})
    
    if event_type == "customer.subscription.created":
        # Subscription created
        subscription_id = object_data.get("id")
        subscription = db.query(Subscription).filter(Subscription.subscription_id == subscription_id).first()
        
        if subscription:
            subscription.status = object_data.get("status")
            subscription.metadata = json.dumps(object_data)
            db.commit()
    
    elif event_type == "customer.subscription.updated":
        # Subscription updated
        subscription_id = object_data.get("id")
        subscription = db.query(Subscription).filter(Subscription.subscription_id == subscription_id).first()
        
        if subscription:
            subscription.status = object_data.get("status")
            subscription.metadata = json.dumps(object_data)
            db.commit()
    
    elif event_type == "customer.subscription.deleted":
        # Subscription cancelled
        subscription_id = object_data.get("id")
        subscription = db.query(Subscription).filter(Subscription.subscription_id == subscription_id).first()
        
        if subscription:
            subscription.status = "CANCELLED"
            subscription.metadata = json.dumps(object_data)
            db.commit()
    
    elif event_type == "invoice.payment_succeeded":
        # Payment succeeded
        transaction_id = object_data.get("id")
        
        # Check if transaction already exists
        existing_transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
        if existing_transaction:
            return
        
        # Find the subscription this payment belongs to
        subscription_id = object_data.get("subscription")
        subscription = db.query(Subscription).filter(Subscription.subscription_id == subscription_id).first()
        
        if subscription:
            # Create a new transaction
            transaction = Transaction(
                user_id=subscription.user_id,
                subscription_id=subscription.id,
                transaction_id=transaction_id,
                provider="stripe",
                amount=float(object_data.get("amount_paid", 0)) / 100,  # Convert cents to dollars
                currency=object_data.get("currency", "usd").upper(),
                status="COMPLETED",
                created_at=datetime.now(),
                metadata=json.dumps(object_data)
            )
            db.add(transaction)
            db.commit()
