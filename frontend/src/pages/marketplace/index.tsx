import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useMarketplace, MarketplaceListing } from '@/lib/marketplace';
import Link from 'next/link';

const MarketplacePage: React.FC = () => {
  const { listings, loading, error, fetchListings } = useMarketplace();
  const [filter, setFilter] = useState<{ item_type?: string; tag?: string }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    fetchListings(filter);
  }, [fetchListings, filter]);

  useEffect(() => {
    // Extract all unique tags from listings
    if (listings.length > 0) {
      const tags = listings.flatMap(listing => listing.tags || []);
      const uniqueTags = [...new Set(tags)];
      setAllTags(uniqueTags);
    }
  }, [listings]);

  const filteredListings = searchTerm
    ? listings.filter(listing => 
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : listings;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Marketplace</h1>
          <Link
            href="/marketplace/list"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
          >
            List Item for Sale
          </Link>
        </div>

        {error && (
          <div className="bg-error/20 border border-error text-text-primary p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="bg-surface rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-grow">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search marketplace..."
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter({})}
                className={`px-3 py-2 rounded-md text-sm ${
                  !filter.item_type 
                    ? 'bg-primary text-white' 
                    : 'bg-background text-text-secondary hover:bg-background/70'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter({ ...filter, item_type: 'agent' })}
                className={`px-3 py-2 rounded-md text-sm ${
                  filter.item_type === 'agent' 
                    ? 'bg-primary text-white' 
                    : 'bg-background text-text-secondary hover:bg-background/70'
                }`}
              >
                Agents
              </button>
              <button
                onClick={() => setFilter({ ...filter, item_type: 'prompt' })}
                className={`px-3 py-2 rounded-md text-sm ${
                  filter.item_type === 'prompt' 
                    ? 'bg-primary text-white' 
                    : 'bg-background text-text-secondary hover:bg-background/70'
                }`}
              >
                Prompts
              </button>
            </div>
          </div>

          {allTags.length > 0 && (
            <div className="mb-6">
              <div className="text-text-secondary mb-2">Filter by tag:</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilter({ ...filter, tag: undefined })}
                  className={`px-3 py-1 rounded-full text-xs ${
                    !filter.tag 
                      ? 'bg-primary text-white' 
                      : 'bg-background text-text-secondary hover:bg-background/70'
                  }`}
                >
                  All Tags
                </button>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setFilter({ ...filter, tag })}
                    className={`px-3 py-1 rounded-full text-xs ${
                      filter.tag === tag 
                        ? 'bg-primary text-white' 
                        : 'bg-background text-text-secondary hover:bg-background/70'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-pulse-slow">Loading marketplace items...</div>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-8">
              <h3 className="text-xl font-medium text-text-primary mb-2">No items found</h3>
              <p className="text-text-secondary mb-6">
                {searchTerm 
                  ? `No items match your search for "${searchTerm}".`
                  : filter.item_type 
                    ? `No ${filter.item_type}s available${filter.tag ? ` with tag "${filter.tag}"` : ''}.`
                    : filter.tag 
                      ? `No items available with tag "${filter.tag}".`
                      : "The marketplace is currently empty. Be the first to list an item!"}
              </p>
              <Link
                href="/marketplace/list"
                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
              >
                List an Item
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="bg-background rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-semibold text-text-primary">{listing.title}</h3>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs uppercase font-medium">
                        {listing.item_type}
                      </span>
                    </div>
                    <p className="text-text-secondary mb-4 line-clamp-2">
                      {listing.description}
                    </p>
                    {listing.tags && listing.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {listing.tags.map(tag => (
                          <span key={tag} className="bg-surface text-text-secondary text-xs px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-primary">
                        {formatPrice(listing.price)}
                      </span>
                      <Link
                        href={`/marketplace/${listing.id}`}
                        className="bg-primary hover:bg-primary/90 text-white px-3 py-1 rounded-md text-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MarketplacePage;
