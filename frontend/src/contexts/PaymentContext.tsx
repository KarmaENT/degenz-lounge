import { createContext, useContext, useState, ReactNode } from 'react';
import { getStripe, createPaymentIntent, confirmPayment, createMarketplaceTransaction } from '../lib/stripe';
import { useAuth } from './AuthContext';

// Types
type PaymentContextType = {
  processing: boolean;
  error: string | null;
  success: boolean;
  processPayment: (amount: number, listingId: string, metadata: any) => Promise<void>;
  clearPaymentState: () => void;
};

// Create context
const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

// Provider component
export function PaymentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Process payment
  const processPayment = async (amount: number, listingId: string, metadata: any) => {
    if (!user) {
      setError('You must be logged in to make a purchase');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setSuccess(false);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Create payment intent
      const { clientSecret, id: paymentIntentId } = await createPaymentIntent(
        amount,
        {
          listing_id: listingId,
          user_id: user.id,
          ...metadata
        },
        token
      );

      // Load Stripe
      const stripe = await getStripe();
      
      // Confirm payment with Stripe
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            // In a real implementation, we would use Stripe Elements
            // This is a simplified version for demonstration
            token: 'tok_visa' // Test token
          },
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Create transaction record
      await createMarketplaceTransaction(listingId, paymentIntentId, token);
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
      console.error('Payment error:', err);
    } finally {
      setProcessing(false);
    }
  };

  // Clear payment state
  const clearPaymentState = () => {
    setError(null);
    setSuccess(false);
  };

  return (
    <PaymentContext.Provider
      value={{
        processing,
        error,
        success,
        processPayment,
        clearPaymentState,
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

// Hook to use payment context
export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
}
