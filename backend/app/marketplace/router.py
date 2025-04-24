from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import uuid
import stripe

from app.database import get_db
from app.models import MarketplaceListing, Transaction, Agent, Prompt
from app.auth.dependencies import get_current_active_user
from app.config import settings

# Initialize Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY

router = APIRouter(prefix="/marketplace", tags=["marketplace"])

# Schemas
class ListingBase(BaseModel):
    title: str
    description: str
    price: float
    item_type: str  # 'agent' or 'prompt'
    item_id: uuid.UUID
    tags: List[str] = []
    preview_data: dict = {}

class ListingCreate(ListingBase):
    pass

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    tags: Optional[List[str]] = None
    preview_data: Optional[dict] = None
    status: Optional[str] = None

class ListingResponse(ListingBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: str
    updated_at: str
    status: str
    
    class Config:
        orm_mode = True

class TransactionResponse(BaseModel):
    id: uuid.UUID
    listing_id: uuid.UUID
    amount: float
    commission_amount: float
    status: str
    created_at: str
    
    class Config:
        orm_mode = True

# Routes
@router.get("/listings", response_model=List[ListingResponse])
async def get_listings(
    skip: int = 0, 
    limit: int = 100, 
    item_type: Optional[str] = None,
    tag: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    query = db.query(MarketplaceListing).filter(MarketplaceListing.status == "active")
    
    if item_type:
        query = query.filter(MarketplaceListing.item_type == item_type)
    
    if tag:
        query = query.filter(MarketplaceListing.tags.contains([tag]))
    
    listings = query.offset(skip).limit(limit).all()
    return listings

@router.post("/listings", response_model=ListingResponse, status_code=status.HTTP_201_CREATED)
async def create_listing(
    listing_data: ListingCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    # Verify item ownership
    if listing_data.item_type == "agent":
        item = db.query(Agent).filter(Agent.id == listing_data.item_id, Agent.user_id == current_user.id).first()
    elif listing_data.item_type == "prompt":
        item = db.query(Prompt).filter(Prompt.id == listing_data.item_id, Prompt.user_id == current_user.id).first()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid item type"
        )
    
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{listing_data.item_type.capitalize()} not found or not owned by you"
        )
    
    new_listing = MarketplaceListing(
        **listing_data.dict(),
        user_id=current_user.id,
        status="active"
    )
    
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    
    return new_listing

@router.get("/listings/{listing_id}", response_model=ListingResponse)
async def get_listing(
    listing_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    listing = db.query(MarketplaceListing).filter(MarketplaceListing.id == listing_id).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    return listing

@router.put("/listings/{listing_id}", response_model=ListingResponse)
async def update_listing(
    listing_id: uuid.UUID, 
    listing_data: ListingUpdate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    listing = db.query(MarketplaceListing).filter(
        MarketplaceListing.id == listing_id, 
        MarketplaceListing.user_id == current_user.id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found or not owned by you"
        )
    
    for key, value in listing_data.dict(exclude_unset=True).items():
        setattr(listing, key, value)
    
    db.commit()
    db.refresh(listing)
    
    return listing

@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_listing(
    listing_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    listing = db.query(MarketplaceListing).filter(
        MarketplaceListing.id == listing_id, 
        MarketplaceListing.user_id == current_user.id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found or not owned by you"
        )
    
    db.delete(listing)
    db.commit()
    
    return None

@router.post("/purchase/{listing_id}", response_model=TransactionResponse)
async def purchase_item(
    listing_id: uuid.UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    listing = db.query(MarketplaceListing).filter(
        MarketplaceListing.id == listing_id,
        MarketplaceListing.status == "active"
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found or not active"
        )
    
    # Prevent buying your own listing
    if listing.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot purchase your own listing"
        )
    
    # Calculate commission
    commission_amount = listing.price * (settings.STRIPE_COMMISSION_PERCENTAGE / 100)
    seller_amount = listing.price - commission_amount
    
    # Create Stripe payment intent
    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=int(listing.price * 100),  # Convert to cents
            currency="usd",
            metadata={
                "listing_id": str(listing.id),
                "buyer_id": str(current_user.id),
                "seller_id": str(listing.user_id),
                "commission_amount": str(commission_amount)
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating payment: {str(e)}"
        )
    
    # Create transaction record
    transaction = Transaction(
        buyer_id=current_user.id,
        seller_id=listing.user_id,
        listing_id=listing.id,
        amount=listing.price,
        commission_amount=commission_amount,
        stripe_payment_id=payment_intent.id,
        status="pending"
    )
    
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    
    # In a real implementation, we would handle the payment confirmation
    # via a webhook and then copy the agent/prompt to the buyer's account
    
    return transaction

@router.get("/purchases", response_model=List[TransactionResponse])
async def get_purchases(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    transactions = db.query(Transaction).filter(Transaction.buyer_id == current_user.id).all()
    return transactions

@router.get("/sales", response_model=List[TransactionResponse])
async def get_sales(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    transactions = db.query(Transaction).filter(Transaction.seller_id == current_user.id).all()
    return transactions
