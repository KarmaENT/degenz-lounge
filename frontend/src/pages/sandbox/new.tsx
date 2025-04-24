import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useSandbox } from '@/lib/sandbox';
import { useAgents } from '@/lib/agents';
import { useRouter } from 'next/router';
import Link from 'next/link';

const NewSandboxPage: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createSession, error: sandboxError, clearError: clearSandboxError } = useSandbox();
  const { agents, loading: agentsLoading, error: agentsError, fetchAgents } = useAgents();
  const router = useRouter();

  React.useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const session = await createSession({
        name,
        configuration: {
          description
        }
      });
      
      router.push(`/sandbox/${session.id}`);
    } catch (err) {
      console.error('Error creating sandbox session:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const error = sandboxError || agentsError;

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Create New Sandbox Session</h1>
          <p className="text-text-secondary mt-2">
            Create a collaborative environment for multiple AI agents to work together.
          </p>
        </div>

        {error && (
          <div className="bg-error/20 border border-error text-text-primary p-4 rounded-md mb-6">
            {error}
            <button 
              onClick={clearSandboxError}
              className="float-right text-text-secondary hover:text-text-primary"
            >
              &times;
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-surface rounded-lg shadow-md p-6">
              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="name" className="block text-text-primary font-medium mb-2">
                    Session Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="e.g., Research Team"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="description" className="block text-text-primary font-medium mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-surface bg-background text-text-primary rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="Describe the purpose of this sandbox session..."
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
                    {isSubmitting ? 'Creating...' : 'Create Session'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-surface rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Available Agents</h2>
              
              {agentsLoading ? (
                <div className="text-center py-4">
                  <div className="animate-pulse-slow">Loading agents...</div>
                </div>
              ) : agents.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-text-secondary mb-4">
                    You don't have any agents yet.
                  </p>
                  <Link
                    href="/agents/new"
                    className="text-primary hover:text-primary/90"
                  >
                    Create your first agent
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-text-secondary mb-4">
                    You'll be able to add these agents to your sandbox after creating the session.
                  </p>
                  <ul className="space-y-2">
                    {agents.slice(0, 5).map((agent) => (
                      <li key={agent.id} className="flex items-center">
                        <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                        <span className="text-text-primary">{agent.name}</span>
                      </li>
                    ))}
                    {agents.length > 5 && (
                      <li className="text-text-secondary text-sm">
                        And {agents.length - 5} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NewSandboxPage;
