import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from './auth';

// Types
export type MarketplaceListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  item_type: 'agent' | 'prompt';
  item_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: string;
  tags: string[];
  preview_data: Record<string, any>;
};

export type Transaction = {
  id: string;
  listing_id: string;
  amount: number;
  commission_amount: number;
  status: string;
  created_at: string;
};

type MarketplaceContextType = {
  listings: MarketplaceListing[];
  purchases: Transaction[];
  sales: Transaction[];
  loading: boolean;
  error: string | null;
  fetchListings: (params?: { item_type?: string; tag?: string }) => Promise<void>;
  createListing: (listing: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status'>) => Promise<MarketplaceListing>;
  updateListing: (id: string, listing: Partial<MarketplaceListing>) => Promise<MarketplaceListing>;
  deleteListing: (id: string) => Promise<void>;
  purchaseItem: (listingId: string) => Promise<Transaction>;
  fetchPurchases: () => Promise<void>;
  fetchSales: () => Promise<void>;
  clearError: () => void;
};

// Create context
const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined);

// Provider component
export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [purchases, setPurchases] = useState<Transaction[]>([]);
  const [sales, setSales] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch listings
  const fetchListings = async (params?: { item_type?: string; tag?: string }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/marketplace/listings', { params });
      setListings(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch listings');
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create listing
  const createListing = async (listing: Omit<MarketplaceListing, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/marketplace/listings', listing);
      setListings([...listings, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create listing');
      console.error('Error creating listing:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update listing
  const updateListing = async (id: string, listing: Partial<MarketplaceListing>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/marketplace/listings/${id}`, listing);
      setListings(listings.map(l => l.id === id ? response.data : l));
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update listing');
      console.error('Error updating listing:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete listing
  const deleteListing = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/marketplace/listings/${id}`);
      setListings(listings.filter(l => l.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete listing');
      console.error('Error deleting listing:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Purchase item
  const purchaseItem = async (listingId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/marketplace/purchase/${listingId}`);
      setPurchases([...purchases, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to purchase item');
      console.error('Error purchasing item:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch purchases
  const fetchPurchases = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/marketplace/purchases');
      setPurchases(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch purchases');
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sales
  const fetchSales = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/marketplace/sales');
      setSales(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch sales');
      console.error('Error fetching sales:', err);
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
        purchases,
        sales,
        loading,
        error,
        fetchListings,
        createListing,
        updateListing,
        deleteListing,
        purchaseItem,
        fetchPurchases,
        fetchSales,
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
