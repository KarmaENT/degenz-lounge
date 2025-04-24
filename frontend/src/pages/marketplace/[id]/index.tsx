import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useMarketplace, MarketplaceListing } from '@/lib/marketplace';
import { useRouter } from 'next/router';
import Link from 'next/link';

const MarketplaceDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { listings, fetchListings, purchaseItem, loading, error } = useMarketplace();
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchListings();
    }
  }, [id, fetchListings]);

  useEffect(() => {
    if (listings.length > 0 && id) {
      const foundListing = listings.find(l => l.id === id);
      setListing(foundListing || null);
    }
  }, [listings, id]);

  const handlePurchase = async () => {
    if (!listing) return;
    
    if (window.confirm(`Are you sure you want to purchase "${listing.title}" for $${listing.price}?`)) {
      setIsPurchasing(true);
      try {
        await purchaseItem(listing.id);
        alert('Purchase successful! The item has been added to your library.');
        router.push('/dashboard');
      } catch (err) {
        console.error('Error purchasing item:', err);
        alert('There was an error processing your purchase. Please try again.');
      } finally {
        setIsPurchasing(false);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  if (loading) {
    return (
      <Layout requireAuth>
        <div className="px-4 py-6">
          <div className="text-center py-8">
            <div className="animate-pulse-slow">Loading item details...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!listing) {
    return (
      <Layout requireAuth>
        <div className="px-4 py-6">
          <div className="bg-error/20 border border-error text-text-primary p-4 rounded-md mb-6">
            Item not found
          </div>
          <Link href="/marketplace" className="text-primary hover:text-primary/90">
            &larr; Back to Marketplace
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="mb-6">
          <Link href="/marketplace" className="text-primary hover:text-primary/90">
            &larr; Back to Marketplace
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-3xl font-bold text-text-primary">{listing.title}</h1>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm uppercase font-medium">
                  {listing.item_type}
                </span>
              </div>
              
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-text-primary mb-2">Description</h2>
                <p className="text-text-secondary whitespace-pre-line">
                  {listing.description}
                </p>
              </div>

              {listing.tags && listing.tags.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-text-primary mb-2">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map(tag => (
                      <span key={tag} className="bg-background text-text-secondary px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {listing.preview_data && Object.keys(listing.preview_data).length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-text-primary mb-2">Preview</h2>
                  <div className="bg-background p-4 rounded-md">
                    {listing.item_type === 'prompt' && listing.preview_data.content && (
                      <pre className="text-text-primary whitespace-pre-wrap font-mono text-sm line-clamp-10">
                        {listing.preview_data.content}
                      </pre>
                    )}
                    {listing.item_type === 'agent' && listing.preview_data.system_prompt && (
                      <div>
                        <div className="text-text-secondary mb-2">System Prompt (Preview):</div>
                        <pre className="text-text-primary whitespace-pre-wrap font-mono text-sm line-clamp-10">
                          {listing.preview_data.system_prompt}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-surface rounded-lg shadow-md p-6 mb-6 sticky top-6">
              <div className="text-center mb-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatPrice(listing.price)}
                </div>
                <div className="text-text-secondary text-sm">
                  Includes 10% marketplace fee
                </div>
              </div>
              
              <button
                onClick={handlePurchase}
                disabled={isPurchasing}
                className="w-full py-3 px-4 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 mb-4"
              >
                {isPurchasing ? 'Processing...' : `Buy Now`}
              </button>
              
              <div className="text-text-secondary text-sm text-center">
                By purchasing, you agree to the <a href="#" className="text-primary hover:text-primary/90">Terms of Service</a>
              </div>
              
              <div className="border-t border-background mt-6 pt-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Seller Information</h3>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center mr-3">
                    <span className="text-primary font-medium">
                      {listing.user_id.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-text-primary font-medium">Seller</div>
                    <div className="text-text-secondary text-sm">Member since {new Date(listing.created_at).getFullYear()}</div>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-background mt-6 pt-6">
                <h3 className="text-lg font-semibold text-text-primary mb-2">Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Type</span>
                    <span className="text-text-primary font-medium capitalize">{listing.item_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Listed</span>
                    <span className="text-text-primary">{new Date(listing.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">ID</span>
                    <span className="text-text-primary text-xs font-mono truncate max-w-[150px]">{listing.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MarketplaceDetailPage;
