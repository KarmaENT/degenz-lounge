

import { useState, useEffect } from 'react';
import { ListingCard } from '@/components/ListingCard';
import { TagFilter } from '@/components/TagFilter';
import type { Listing } from '@/types';

const MarketplacePage = () => {
  const { listings, loading, error } = useListings();
  const [filteredListings, setFilteredListings] = useState<Listing[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  // Extract unique tags from listings
  useEffect(() => {
    if (listings.length > 0) {
      const tags = listings.flatMap(listing => listing.tags || []);
      
      // Updated Set iteration - choose one approach:
      
      // Option 1: Using Array.from (recommended)
      const uniqueTags = Array.from(new Set(tags));
      
      // Option 2: Using forEach
      // const uniqueTags = [] as string[];
      // new Set(tags).forEach(tag => uniqueTags.push(tag));
      
      setAllTags(uniqueTags);
    }
  }, [listings]);

  // Filter listings based on selected tags
  useEffect(() => {
    if (selectedTags.size === 0) {
      setFilteredListings(listings);
    } else {
      setFilteredListings(
        listings.filter(listing => 
          listing.tags?.some(tag => selectedTags.has(tag))
        )
      );
    }
  }, [listings, selectedTags]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tag)) {
        newSet.delete(tag);
      } else {
        newSet.add(tag);
      }
      return newSet;
    });
  };

  if (loading) return <div>Loading listings...</div>;
  if (error) return <div>Error loading listings: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">NFT Marketplace</h1>
      
      <TagFilter 
        allTags={allTags}
        selectedTags={selectedTags}
        onTagToggle={handleTagToggle}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {filteredListings.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
};

export default MarketplacePage;
