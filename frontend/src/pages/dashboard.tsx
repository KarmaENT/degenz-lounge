import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/lib/auth';
import { useAgents } from '@/lib/agents';
import { usePrompts } from '@/lib/prompts';
import { useSandbox } from '@/lib/sandbox';
import Link from 'next/link';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { agents, fetchAgents } = useAgents();
  const { prompts, fetchPrompts } = usePrompts();
  const { sessions, fetchSessions } = useSandbox();

  useEffect(() => {
    fetchAgents();
    fetchPrompts();
    fetchSessions();
  }, [fetchAgents, fetchPrompts, fetchSessions]);

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <h1 className="text-3xl font-bold text-text-primary mb-8">Dashboard</h1>
        
        <div className="bg-surface rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Welcome, {user?.email}</h2>
          <p className="text-text-secondary mb-4">
            This is your DeGeNz Lounge dashboard. Here you can manage your AI agents, prompts, and sandbox sessions.
          </p>
          <p className="text-text-secondary">
            Your current subscription tier: <span className="text-primary font-medium">{user?.subscription_tier}</span>
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-surface rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Your Agents</h3>
              <Link href="/agents" className="text-primary hover:text-primary/90 text-sm">
                View all
              </Link>
            </div>
            {agents.length > 0 ? (
              <ul className="space-y-2">
                {agents.slice(0, 3).map((agent) => (
                  <li key={agent.id} className="border-b border-background pb-2">
                    <Link href={`/agents/${agent.id}`} className="text-text-primary hover:text-primary">
                      {agent.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-secondary">No agents created yet.</p>
            )}
            <div className="mt-4">
              <Link 
                href="/agents/new" 
                className="inline-flex items-center text-sm text-primary hover:text-primary/90"
              >
                + Create new agent
              </Link>
            </div>
          </div>
          
          <div className="bg-surface rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Your Prompts</h3>
              <Link href="/prompts" className="text-primary hover:text-primary/90 text-sm">
                View all
              </Link>
            </div>
            {prompts.length > 0 ? (
              <ul className="space-y-2">
                {prompts.slice(0, 3).map((prompt) => (
                  <li key={prompt.id} className="border-b border-background pb-2">
                    <Link href={`/prompts/${prompt.id}`} className="text-text-primary hover:text-primary">
                      {prompt.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-secondary">No prompts created yet.</p>
            )}
            <div className="mt-4">
              <Link 
                href="/prompts/new" 
                className="inline-flex items-center text-sm text-primary hover:text-primary/90"
              >
                + Create new prompt
              </Link>
            </div>
          </div>
          
          <div className="bg-surface rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Sandbox Sessions</h3>
              <Link href="/sandbox" className="text-primary hover:text-primary/90 text-sm">
                View all
              </Link>
            </div>
            {sessions.length > 0 ? (
              <ul className="space-y-2">
                {sessions.slice(0, 3).map((session) => (
                  <li key={session.id} className="border-b border-background pb-2">
                    <Link href={`/sandbox/${session.id}`} className="text-text-primary hover:text-primary">
                      {session.name}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-secondary">No sandbox sessions created yet.</p>
            )}
            <div className="mt-4">
              <Link 
                href="/sandbox/new" 
                className="inline-flex items-center text-sm text-primary hover:text-primary/90"
              >
                + Create new session
              </Link>
            </div>
          </div>
        </div>
        
        <div className="bg-surface rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/agents/new" 
              className="bg-background hover:bg-surface border border-surface rounded-md p-4 text-center"
            >
              <div className="text-primary text-xl mb-2">🤖</div>
              <div className="text-text-primary font-medium">Create Agent</div>
            </Link>
            <Link 
              href="/prompts/new" 
              className="bg-background hover:bg-surface border border-surface rounded-md p-4 text-center"
            >
              <div className="text-primary text-xl mb-2">📝</div>
              <div className="text-text-primary font-medium">Create Prompt</div>
            </Link>
            <Link 
              href="/sandbox/new" 
              className="bg-background hover:bg-surface border border-surface rounded-md p-4 text-center"
            >
              <div className="text-primary text-xl mb-2">🧪</div>
              <div className="text-text-primary font-medium">New Sandbox</div>
            </Link>
            <Link 
              href="/marketplace" 
              className="bg-background hover:bg-surface border border-surface rounded-md p-4 text-center"
            >
              <div className="text-primary text-xl mb-2">🛒</div>
              <div className="text-text-primary font-medium">Marketplace</div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
