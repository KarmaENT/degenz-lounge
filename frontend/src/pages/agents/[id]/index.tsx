import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAgents, Agent } from '@/lib/agents';
import { useRouter } from 'next/router';
import Link from 'next/link';

const AgentDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { agents, fetchAgents, duplicateAgent, deleteAgent } = useAgents();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    const loadAgent = async () => {
      setIsLoading(true);
      await fetchAgents();
      setIsLoading(false);
    };

    if (id) {
      loadAgent();
    }
  }, [id, fetchAgents]);

  useEffect(() => {
    if (agents.length > 0 && id) {
      const foundAgent = agents.find(a => a.id === id);
      setAgent(foundAgent || null);
    }
  }, [agents, id]);

  const handleDelete = async () => {
    if (!agent) return;
    
    if (window.confirm('Are you sure you want to delete this agent?')) {
      setIsDeleting(true);
      try {
        await deleteAgent(agent.id);
        router.push('/agents');
      } catch (err) {
        console.error('Error deleting agent:', err);
        setIsDeleting(false);
      }
    }
  };

  const handleDuplicate = async () => {
    if (!agent) return;
    
    setIsDuplicating(true);
    try {
      const newAgent = await duplicateAgent(agent.id);
      router.push(`/agents/${newAgent.id}`);
    } catch (err) {
      console.error('Error duplicating agent:', err);
      setIsDuplicating(false);
    }
  };

  if (isLoading) {
    return (
      <Layout requireAuth>
        <div className="px-4 py-6">
          <div className="text-center py-8">
            <div className="animate-pulse-slow">Loading agent...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!agent) {
    return (
      <Layout requireAuth>
        <div className="px-4 py-6">
          <div className="bg-error/20 border border-error text-text-primary p-4 rounded-md mb-6">
            Agent not found
          </div>
          <Link href="/agents" className="text-primary hover:text-primary/90">
            &larr; Back to Agents
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="mb-6">
          <Link href="/agents" className="text-primary hover:text-primary/90">
            &larr; Back to Agents
          </Link>
        </div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{agent.name}</h1>
            <div className="flex items-center mt-2">
              <span className={`mr-2 w-2 h-2 rounded-full ${agent.is_public ? 'bg-success' : 'bg-warning'}`}></span>
              <span className="text-text-secondary">{agent.is_public ? 'Public' : 'Private'}</span>
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
              href={`/agents/${agent.id}/edit`}
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
                {agent.description || 'No description provided.'}
              </p>
            </div>

            <div className="bg-surface rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">System Prompt</h2>
              <div className="bg-background p-4 rounded-md">
                <pre className="text-text-primary whitespace-pre-wrap font-mono text-sm">
                  {agent.system_prompt}
                </pre>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-surface rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Actions</h2>
              <div className="space-y-4">
                <Link
                  href={`/sandbox/new?agent=${agent.id}`}
                  className="block w-full py-2 px-4 bg-primary text-white text-center rounded-md hover:bg-primary/90"
                >
                  Use in Sandbox
                </Link>
                <Link
                  href={`/marketplace/list?type=agent&id=${agent.id}`}
                  className="block w-full py-2 px-4 border border-primary text-primary text-center rounded-md hover:bg-primary/10"
                >
                  List on Marketplace
                </Link>
              </div>
            </div>

            <div className="bg-surface rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">Details</h2>
              <div className="space-y-3">
                <div>
                  <div className="text-text-secondary text-sm">Created</div>
                  <div className="text-text-primary">
                    {new Date(agent.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm">Last Updated</div>
                  <div className="text-text-primary">
                    {new Date(agent.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-text-secondary text-sm">ID</div>
                  <div className="text-text-primary text-sm font-mono truncate">
                    {agent.id}
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

export default AgentDetailPage;
