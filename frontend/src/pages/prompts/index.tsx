import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { usePrompts, Prompt } from '@/lib/prompts';
import Link from 'next/link';

const PromptsPage: React.FC = () => {
  const { prompts, loading, error, fetchPrompts, deletePrompt } = usePrompts();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  useEffect(() => {
    // Extract all unique tags from prompts
    if (prompts.length > 0) {
      const tags = prompts.flatMap(prompt => prompt.tags || []);
      const uniqueTags = [...new Set(tags)];
      setAllTags(uniqueTags);
    }
  }, [prompts]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      setIsDeleting(id);
      try {
        await deletePrompt(id);
      } catch (err) {
        console.error('Error deleting prompt:', err);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const filteredPrompts = filterTag 
    ? prompts.filter(prompt => prompt.tags?.includes(filterTag))
    : prompts;

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Your Prompts</h1>
          <Link
            href="/prompts/new"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
          >
            Create New Prompt
          </Link>
        </div>

        {error && (
          <div className="bg-error/20 border border-error text-text-primary p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {allTags.length > 0 && (
          <div className="mb-6">
            <div className="text-text-secondary mb-2">Filter by tag:</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterTag(null)}
                className={`px-3 py-1 rounded-full text-sm ${
                  filterTag === null 
                    ? 'bg-primary text-white' 
                    : 'bg-surface text-text-secondary hover:bg-surface/70'
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filterTag === tag 
                      ? 'bg-primary text-white' 
                      : 'bg-surface text-text-secondary hover:bg-surface/70'
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
            <div className="animate-pulse-slow">Loading prompts...</div>
          </div>
        ) : filteredPrompts.length === 0 ? (
          <div className="bg-surface rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-medium text-text-primary mb-2">No prompts found</h3>
            <p className="text-text-secondary mb-6">
              {filterTag 
                ? `No prompts found with tag "${filterTag}". Try a different filter or create a new prompt.`
                : "You haven't created any prompts yet. Create your first prompt to get started."}
            </p>
            <Link
              href="/prompts/new"
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
            >
              Create Your First Prompt
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <div key={prompt.id} className="bg-surface rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-text-primary mb-2">{prompt.title}</h3>
                  <p className="text-text-secondary mb-4 line-clamp-2">
                    {prompt.description || 'No description provided'}
                  </p>
                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {prompt.tags.map(tag => (
                        <span key={tag} className="bg-background text-text-secondary text-xs px-2 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center text-sm text-text-secondary">
                    <span className={`mr-2 w-2 h-2 rounded-full ${prompt.is_public ? 'bg-success' : 'bg-warning'}`}></span>
                    {prompt.is_public ? 'Public' : 'Private'}
                  </div>
                </div>
                <div className="bg-background px-6 py-3 flex justify-between">
                  <div className="space-x-2">
                    <Link
                      href={`/prompts/${prompt.id}`}
                      className="text-primary hover:text-primary/90"
                    >
                      View
                    </Link>
                    <Link
                      href={`/prompts/${prompt.id}/edit`}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      Edit
                    </Link>
                  </div>
                  <button
                    onClick={() => handleDelete(prompt.id)}
                    disabled={isDeleting === prompt.id}
                    className="text-error hover:text-error/90 disabled:opacity-50"
                  >
                    {isDeleting === prompt.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PromptsPage;
