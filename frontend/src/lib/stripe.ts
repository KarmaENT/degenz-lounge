import { loadStripe } from '@stripe/stripe-js';
import axios from 'axios';

// Initialize Stripe
const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '';

if (!stripePublicKey) {
  console.error('Missing Stripe public key');
}

let stripePromise: Promise<any> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublicKey);
  }
  return stripePromise;
};

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance with auth header
const createAxiosInstance = (token: string) => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
};

// Payment functions
export const createPaymentIntent = async (amount: number, metadata: any, token: string) => {
  const api = createAxiosInstance(token);
  const response = await api.post('/payments/create-intent', {
    amount,
    metadata
  });
  return response.data;
};

export const confirmPayment = async (paymentIntentId: string, token: string) => {
  const api = createAxiosInstance(token);
  const response = await api.post('/payments/confirm', {
    payment_intent_id: paymentIntentId
  });
  return response.data;
};

// Marketplace transaction functions
export const createMarketplaceTransaction = async (
  listingId: string, 
  paymentIntentId: string,
  token: string
) => {
  const api = createAxiosInstance(token);
  const response = await api.post('/marketplace/transactions', {
    listing_id: listingId,
    payment_intent_id: paymentIntentId
  });
  return response.data;
};

export const getTransactionStatus = async (transactionId: string, token: string) => {
  const api = createAxiosInstance(token);
  const response = await api.get(`/marketplace/transactions/${transactionId}`);
  return response.data;
};

// Subscription functions
export const createSubscription = async (priceId: string, token: string) => {
  const api = createAxiosInstance(token);
  const response = await api.post('/subscriptions/create', {
    price_id: priceId
  });
  return response.data;
};

export const cancelSubscription = async (subscriptionId: string, token: string) => {
  const api = createAxiosInstance(token);
  const response = await api.post(`/subscriptions/${subscriptionId}/cancel`);
  return response.data;
};

export const getSubscriptionStatus = async (token: string) => {
  const api = createAxiosInstance(token);
  const response = await api.get('/subscriptions/status');
  return response.data;
};

// Checkout session
export const createCheckoutSession = async (
  priceId: string, 
  successUrl: string, 
  cancelUrl: string,
  token: string
) => {
  const api = createAxiosInstance(token);
  const response = await api.post('/payments/create-checkout-session', {
    price_id: priceId,
    success_url: successUrl,
    cancel_url: cancelUrl
  });
  return response.data;
};

// Redirect to Stripe Checkout
export const redirectToCheckout = async (sessionId: string) => {
  const stripe = await getStripe();
  const { error } = await stripe.redirectToCheckout({
    sessionId
  });
  
  if (error) {
    console.error('Stripe checkout error:', error);
    throw new Error(error.message);
  }
};
