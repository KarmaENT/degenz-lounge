import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getSubscriptionStatus, createCheckoutSession, redirectToCheckout } from '../lib/stripe';

// Types
type SubscriptionTier = 'basic' | 'pro';

type SubscriptionStatus = {
  tier: SubscriptionTier;
  active: boolean;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
};

type SubscriptionContextType = {
  subscriptionStatus: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  upgradeSubscription: (successUrl: string, cancelUrl: string) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
};

// Create context
const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// Provider component
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription status on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshSubscriptionStatus();
    } else {
      setSubscriptionStatus(null);
    }
  }, [user]);

  // Refresh subscription status
  const refreshSubscriptionStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const status = await getSubscriptionStatus(token);
      setSubscriptionStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscription status');
      console.error('Subscription status error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Upgrade subscription
  const upgradeSubscription = async (successUrl: string, cancelUrl: string) => {
    if (!user) {
      setError('You must be logged in to upgrade your subscription');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Create checkout session
      const { sessionId } = await createCheckoutSession(
        'price_pro_monthly', // This would be your actual Stripe price ID
        successUrl,
        cancelUrl,
        token
      );

      // Redirect to Stripe Checkout
      await redirectToCheckout(sessionId);
    } catch (err: any) {
      setError(err.message || 'Failed to upgrade subscription');
      console.error('Subscription upgrade error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    if (!user || !subscriptionStatus?.active) {
      setError('No active subscription to cancel');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // This would call your backend to cancel the subscription
      // For now, we'll just update the local state
      setSubscriptionStatus({
        ...subscriptionStatus,
        cancelAtPeriodEnd: true
      });

      // In a real implementation, you would call your backend:
      // await cancelSubscription(subscriptionStatus.id, token);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel subscription');
      console.error('Subscription cancellation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionStatus,
        loading,
        error,
        upgradeSubscription,
        cancelSubscription,
        refreshSubscriptionStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

// Hook to use subscription context
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
