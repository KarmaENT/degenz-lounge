import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAgents, Agent } from '@/lib/agents';
import Link from 'next/link';

const AgentsPage: React.FC = () => {
  const { agents, loading, error, fetchAgents, deleteAgent } = useAgents();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this agent?')) {
      setIsDeleting(id);
      try {
        await deleteAgent(id);
      } catch (err) {
        console.error('Error deleting agent:', err);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Your Agents</h1>
          <Link
            href="/agents/new"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
          >
            Create New Agent
          </Link>
        </div>

        {error && (
          <div className="bg-error/20 border border-error text-text-primary p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse-slow">Loading agents...</div>
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-surface rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-medium text-text-primary mb-2">No agents found</h3>
            <p className="text-text-secondary mb-6">
              You haven't created any agents yet. Create your first agent to get started.
            </p>
            <Link
              href="/agents/new"
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
            >
              Create Your First Agent
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-surface rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-text-primary mb-2">{agent.name}</h3>
                  <p className="text-text-secondary mb-4 line-clamp-2">
                    {agent.description || 'No description provided'}
                  </p>
                  <div className="flex items-center text-sm text-text-secondary mb-4">
                    <span className={`mr-2 w-2 h-2 rounded-full ${agent.is_public ? 'bg-success' : 'bg-warning'}`}></span>
                    {agent.is_public ? 'Public' : 'Private'}
                  </div>
                </div>
                <div className="bg-background px-6 py-3 flex justify-between">
                  <div className="space-x-2">
                    <Link
                      href={`/agents/${agent.id}`}
                      className="text-primary hover:text-primary/90"
                    >
                      View
                    </Link>
                    <Link
                      href={`/agents/${agent.id}/edit`}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      Edit
                    </Link>
                  </div>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    disabled={isDeleting === agent.id}
                    className="text-error hover:text-error/90 disabled:opacity-50"
                  >
                    {isDeleting === agent.id ? 'Deleting...' : 'Delete'}
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

export default AgentsPage;
