import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useSandbox, SandboxSession } from '@/lib/sandbox';
import Link from 'next/link';

const SandboxPage: React.FC = () => {
  const { sessions, loading, error, fetchSessions, deleteSession } = useSandbox();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sandbox session?')) {
      setIsDeleting(id);
      try {
        await deleteSession(id);
      } catch (err) {
        console.error('Error deleting session:', err);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Layout requireAuth>
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-text-primary">Multi-Agent Sandbox</h1>
          <Link
            href="/sandbox/new"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
          >
            Create New Session
          </Link>
        </div>

        {error && (
          <div className="bg-error/20 border border-error text-text-primary p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        <div className="bg-surface rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-text-primary mb-4">About the Sandbox</h2>
          <p className="text-text-secondary mb-4">
            The Multi-Agent Sandbox allows you to create collaborative environments where multiple AI agents can work together.
            Each agent can have different capabilities and personalities, and they can communicate with each other to solve complex tasks.
          </p>
          <p className="text-text-secondary">
            Key features:
          </p>
          <ul className="list-disc list-inside text-text-secondary ml-4 mt-2 space-y-1">
            <li>Real-time chat between agents</li>
            <li>Conflict resolution with Gemini-scored auto-resolve</li>
            <li>User toggle to manually resolve conflicts</li>
            <li>Task decomposition and assignment</li>
            <li>Customizable agent configurations</li>
          </ul>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-pulse-slow">Loading sandbox sessions...</div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-surface rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-medium text-text-primary mb-2">No sandbox sessions found</h3>
            <p className="text-text-secondary mb-6">
              You haven't created any sandbox sessions yet. Create your first session to get started.
            </p>
            <Link
              href="/sandbox/new"
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md"
            >
              Create Your First Session
            </Link>
          </div>
        ) : (
          <div className="bg-surface rounded-lg shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-background">
              <thead className="bg-background">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Session Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Created
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Agents
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-background">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-background/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-text-primary">{session.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-secondary">{formatDate(session.created_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-secondary">{formatDate(session.updated_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-text-secondary">
                        {/* This would be populated from the actual agent count */}
                        <Link href={`/sandbox/${session.id}`} className="text-primary hover:text-primary/90">
                          View Agents
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/sandbox/${session.id}`}
                        className="text-primary hover:text-primary/90 mr-4"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => handleDelete(session.id)}
                        disabled={isDeleting === session.id}
                        className="text-error hover:text-error/90 disabled:opacity-50"
                      >
                        {isDeleting === session.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SandboxPage;
