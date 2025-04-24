import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

// Types
type MarketplaceListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  item_type: 'agent' | 'prompt';
  item_id: string;
  user_id: string;
  tags: string[];
  preview_data: any;
  created_at: string;
  updated_at: string;
};

type MarketplaceContextType = {
  listings: MarketplaceListing[];
  loading: boolean;
  error: string | null;
  fetchListings: (filter?: { item_type?: string; tag?: string }) => Promise<void>;
  createListing: (listing: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<MarketplaceListing>;
  purchaseItem: (listingId: string) => Promise<void>;
  clearError: () => void;
};

// Create context
const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Provider component
export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create axios instance with auth header
  const createAxiosInstance = () => {
    const token = localStorage.getItem('token');
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
  };

  // Fetch listings
  const fetchListings = async (filter?: { item_type?: string; tag?: string }) => {
    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      
      // Build query params
      let url = '/marketplace/listings';
      const params: Record<string, string> = {};
      
      if (filter?.item_type) {
        params.item_type = filter.item_type;
      }
      
      if (filter?.tag) {
        params.tag = filter.tag;
      }
      
      const response = await api.get(url, { params });
      setListings(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch listings');
      console.error('Marketplace error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create listing
  const createListing = async (listing: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('You must be logged in to create a listing');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.post('/marketplace/listings', listing);
      
      // Add the new listing to the state
      setListings(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
      console.error('Marketplace error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Purchase item
  const purchaseItem = async (listingId: string) => {
    if (!user) {
      throw new Error('You must be logged in to make a purchase');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      await api.post(`/marketplace/purchase/${listingId}`);
      
      // In a real implementation, this would redirect to Stripe Checkout
      // For now, we'll just simulate a successful purchase
    } catch (err: any) {
      setError(err.message || 'Failed to purchase item');
      console.error('Marketplace error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <MarketplaceContext.Provider
      value={{
        listings,
        loading,
        error,
        fetchListings,
        createListing,
        purchaseItem,
        clearError,
      }}
    >
      {children}
    </MarketplaceContext.Provider>
  );
}

// Hook to use marketplace context
export function useMarketplace() {
  const context = useContext(MarketplaceContext);
  if (context === undefined) {
    throw new Error('useMarketplace must be used within a MarketplaceProvider');
  }
  return context;
}
