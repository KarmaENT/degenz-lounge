import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAgents } from '@/lib/agents';
import { usePrompts } from '@/lib/prompts';
import { useMarketplace } from '@/lib/marketplace';
import { useRouter } from 'next/router';
import Link from 'next/link';

const ListItemPage: React.FC = () => {
  const router = useRouter();
  const { type, id } = router.query;
  
  const { agents, fetchAgents } = useAgents();
  const { prompts, fetchPrompts } = usePrompts();
  const { createListing, error, clearError } = useMarketplace();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [itemType, setItemType] = useState<'agent' | 'prompt'>(type as any || 'agent');
  const [itemId, setItemId] = useState(id as string || '');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewData, setPreviewData] = useState({});

  useEffect(() => {
    fetchAgents();
    fetchPrompts();
  }, [fetchAgents, fetchPrompts]);

  useEffect(() => {
    if (type) {
      setItemType(type as 'agent' | 'prompt');
    }
    if (id) {
      setItemId(id as string);
    }
  }, [type, id]);

  useEffect(() => {
    // Auto-fill form when item is selected
    if (itemType === 'agent' && itemId) {
      const agent = agents.find(a => a.id === itemId);
      if (agent) {
        setTitle(agent.name);
        setDescription(agent.description || '');
        setPreviewData({
          system_prompt: agent.system_prompt
        });
      }
    } else if (itemType === 'prompt' && itemId) {
      const prompt = prompts.find(p => p.id === itemId);
      if (prompt) {
        setTitle(prompt.title);
        setDescription(prompt.description || '');
        setTags(prompt.tags.join(', '));
        setPreviewData({
          content: prompt.content
        });
      }
    }
  }, [itemType, itemId, agents, prompts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemId) {
      alert('Please select an item to list');
      return;
    }
    
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const tagsArray = tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const listing = await createListing({
        title,
        description,
        price: parseFloat(price),
        item_type: itemType,
        item_id: itemId,
        tags: tagsArray,
        preview_data: previewData
      });
      
      router.push(`/marketplace/${listing.id}`);
    } catch (err) {
      console.error('Error creating listing:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="mb-6">
          <Link href="/marketplace" className="text-primary hover:text-primary/90">
            &larr; Back to Marketplace
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary">List Item for Sale</h1>
          <p className="text-text-secondary mt-2">
            Create a listing to sell your agent or prompt on the marketplace.
          </p>
        </div>

        {error && (
          <div className="bg-error/20 border border-error text-text-primary p-4 rounded-md mb-6">
            {error}
            <button 
              onClick={clearError}
              className="float-right text-text-secondary hover:text-text-primary"
            >
              &times;
            </button>
          </div>
        )}

        <div className="bg-surface rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-text-primary font-medium mb-2">
                Item Type
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary focus:ring-primary h-4 w-4"
                    value="agent"
                    checked={itemType === 'agent'}
                    onChange={() => {
                      setItemType('agent');
                      setItemId('');
                      setTitle('');
                      setDescription('');
                      setPreviewData({});
                    }}
                  />
                  <span className="ml-2 text-text-primary">Agent</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="form-radio text-primary focus:ring-primary h-4 w-4"
                    value="prompt"
                    checked={itemType === 'prompt'}
                    onChange={() => {
                      setItemType('prompt');
                      setItemId('');
                      setTitle('');
                      setDescription('');
                      setPreviewData({});
                    }}
                  />
                  <span className="ml-2 text-text-primary">Prompt</span>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="itemId" className="block text-text-primary font-medium mb-2">
                Select {itemType === 'agent' ? 'Agent' : 'Prompt'}
              </label>
              <select
                id="itemId"
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              >
                <option value="">Select an item...</option>
                {itemType === 'agent' ? (
                  agents.map(agent => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))
                ) : (
                  prompts.map(prompt => (
                    <option key={prompt.id} value={prompt.id}>{prompt.title}</option>
                  ))
                )}
              </select>
            </div>

            <div className="mb-6">
              <label htmlFor="title" className="block text-text-primary font-medium mb-2">
                Listing Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Enter a title for your listing"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="description" className="block text-text-primary font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Describe your item and its capabilities"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="price" className="block text-text-primary font-medium mb-2">
                Price (USD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-text-secondary">$</span>
                </div>
                <input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  min="0.01"
                  step="0.01"
                  className="w-full pl-7 px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                  placeholder="0.00"
                />
              </div>
              <p className="mt-2 text-sm text-text-secondary">
                A 10% marketplace fee will be deducted from sales.
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="tags" className="block text-text-primary font-medium mb-2">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., creative, productivity, research"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.back()}
                className="mr-4 px-4 py-2 border border-surface text-text-secondary rounded-md hover:bg-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Listing...' : 'Create Listing'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ListItemPage;
