import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { usePrompts, Prompt } from '@/lib/prompts';
import { useRouter } from 'next/router';
import Link from 'next/link';

const PromptDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { prompts, fetchPrompts, duplicatePrompt, deletePrompt } = usePrompts();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    const loadPrompt = async () => {
      setIsLoading(true);
      await fetchPrompts();
      setIsLoading(false);
    };

    if (id) {
      loadPrompt();
    }
  }, [id, fetchPrompts]);

  useEffect(() => {
    if (prompts.length > 0 && id) {
      const foundPrompt = prompts.find(p => p.id === id);
      setPrompt(foundPrompt || null);
    }
  }, [prompts, id]);

  const handleDelete = async () => {
    if (!prompt) return;
    
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      setIsDeleting(true);
      try {
        await deletePrompt(prompt.id);
        router.push('/prompts');
      } catch (err) {
        console.error('Error deleting prompt:', err);
        setIsDeleting(false);
      }
    }
  };

  const handleDuplicate = async () => {
    if (!prompt) return;
    
    setIsDuplicating(true);
    try {
      const newPrompt = await duplicatePrompt(prompt.id);
      router.push(`/prompts/${newPrompt.id}`);
    } catch (err) {
      console.error('Error duplicating prompt:', err);
      setIsDuplicating(false);
    }
  };

  if (isLoading) {
    return (
      <Layout requireAuth>
        <div className="px-4 py-6">
          <div className="text-center py-8">
            <div className="animate-pulse-slow">Loading prompt...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!prompt) {
    return (
      <Layout requireAuth>
        <div className="px-4 py-6">
          <div className="bg-error/20 border border-error text-text-primary p-4 rounded-md mb-6">
            Prompt not found
          </div>
          <Link href="/prompts" className="text-primary hover:text-primary/90">
            &larr; Back to Prompts
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="mb-6">
          <Link href="/prompts" className="text-primary hover:text-primary/90">
            &larr; Back to Prompts
          </Link>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{prompt.title}</h1>
            <div className="flex items-center mt-2">
              <span className={`mr-2 w-2 h-2 rounded-full ${prompt.is_public ? 'bg-success' : 'bg-warning'}`}></span>
              <span className="text-text-secondary">{prompt.is_public ? 'Public' : 'Private'}</span>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="px-4 py-2 border border-surface text-text-secondary rounded-md hover:bg-surface disabled:opacity-50"
            >
              {isDuplicating ? 'Duplicating...' : 'Duplicate'}
            </button>
            <Link
              href={`/prompts/${prompt.id}/edit`}
              className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-error text-white rounded-md hover:bg-error/90 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Description</h2>
              <p className="text-text-secondary whitespace-pre-line">
                {prompt.description || 'No description provided.'}
              </p>
            </div>

            <div className="bg-surface rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Prompt Content</h2>
              <div className="bg-background p-4 rounded-md">
                <pre className="text-text-primary whitespace-pre-wrap font-mono text-sm">
                  {prompt.content}
                </pre>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-surface rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Actions</h2>
              <div className="space-y-4">
                <Link
                  href={`/marketplace/list?type=prompt&id=${prompt.id}`}
                  className="block w-full py-2 px-4 border border-primary text-primary text-center rounded-md hover:bg-primary/10"
                >
                  List on Marketplace
                </Link>
              </div>
            </div>

            {prompt.tags && prompt.tags.length > 0 && (
              <div className="bg-surface rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {prompt.tags.map(tag => (
                    <span key={tag} className="bg-background text-text-secondary px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-surface rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Details</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-text-secondary text-sm">Created</div>
                  <div className="text-text-primary">
                    {new Date(prompt.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm">Last Updated</div>
                  <div className="text-text-primary">
                    {new Date(prompt.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm">ID</div>
                  <div className="text-text-primary text-sm font-mono truncate">
                    {prompt.id}
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

export default PromptDetailPage;
