import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAgents } from '@/lib/agents';
import { useRouter } from 'next/router';

const NewAgentPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createAgent, error, clearError } = useAgents();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const agent = await createAgent({
        name,
        description,
        system_prompt: systemPrompt,
        is_public: isPublic,
        configuration: {}
      });
      
      router.push(`/agents/${agent.id}`);
    } catch (err) {
      console.error('Error creating agent:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Create New Agent</h1>
          <p className="text-text-secondary mt-2">
            Define your AI agent's personality, capabilities, and behavior.
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
              <label htmlFor="name" className="block text-text-primary font-medium mb-2">
                Agent Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., Research Assistant"
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
                rows={3}
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Describe what this agent does..."
              />
            </div>

            <div className="mb-6">
              <label htmlFor="systemPrompt" className="block text-text-primary font-medium mb-2">
                System Prompt
              </label>
              <textarea
                id="systemPrompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                required
                rows={6}
                className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="You are a helpful research assistant..."
              />
              <p className="mt-2 text-sm text-text-secondary">
                This is the instruction that defines your agent's behavior and capabilities.
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-center">
                <input
                  id="isPublic"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-surface rounded bg-background"
                />
                <label htmlFor="isPublic" className="ml-2 block text-text-primary">
                  Make this agent public
                </label>
              </div>
              <p className="mt-1 text-sm text-text-secondary ml-6">
                Public agents can be used by other users in their sandbox.
              </p>
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
                {isSubmitting ? 'Creating...' : 'Create Agent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default NewAgentPage;
