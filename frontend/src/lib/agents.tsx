import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from './auth';

// Types
export type Agent = {
  id: string;
  name: string;
  description?: string;
  system_prompt: string;
  is_public: boolean;
  configuration: Record<string, any>;
  user_id: string;
  created_at: string;
  updated_at: string;
};

type AgentContextType = {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  fetchAgents: () => Promise<void>;
  createAgent: (agent: Omit<Agent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Agent>;
  updateAgent: (id: string, agent: Partial<Agent>) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  duplicateAgent: (id: string) => Promise<Agent>;
  clearError: () => void;
};

// Create context
const AgentContext = createContext<AgentContextType | undefined>(undefined);

// Provider component
export function AgentProvider({ children }: { children: ReactNode }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch agents
  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/agents');
      setAgents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch agents');
      console.error('Error fetching agents:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create agent
  const createAgent = async (agent: Omit<Agent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/agents', agent);
      setAgents([...agents, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create agent');
      console.error('Error creating agent:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update agent
  const updateAgent = async (id: string, agent: Partial<Agent>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/agents/${id}`, agent);
      setAgents(agents.map(a => a.id === id ? response.data : a));
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update agent');
      console.error('Error updating agent:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete agent
  const deleteAgent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/agents/${id}`);
      setAgents(agents.filter(a => a.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete agent');
      console.error('Error deleting agent:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Duplicate agent
  const duplicateAgent = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/agents/${id}/duplicate`);
      setAgents([...agents, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to duplicate agent');
      console.error('Error duplicating agent:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <AgentContext.Provider
      value={{
        agents,
        loading,
        error,
        fetchAgents,
        createAgent,
        updateAgent,
        deleteAgent,
        duplicateAgent,
        clearError,
      }}
    >
      {children}
    </AgentContext.Provider>
  );
}

// Hook to use agent context
export function useAgents() {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentProvider');
  }
  return context;
}
