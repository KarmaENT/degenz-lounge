import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

// Types
type Agent = {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  is_public: boolean;
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
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  duplicateAgent: (id: string) => Promise<Agent>;
  clearError: () => void;
};

// Create context
const AgentContext = createContext<AgentContextType | undefined>(undefined);

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Provider component
export function AgentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create axios instance with auth header
  const createAxiosInstance = () => {
    const token = localStorage.getItem('token');
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
  };

  // Fetch agents
  const fetchAgents = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.get('/agents');
      setAgents(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch agents');
      console.error('Agent error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create agent
  const createAgent = async (agent: Omit<Agent, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('You must be logged in to create an agent');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.post('/agents', agent);
      
      // Add the new agent to the state
      setAgents(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
      console.error('Agent error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update agent
  const updateAgent = async (id: string, updates: Partial<Agent>) => {
    if (!user) {
      throw new Error('You must be logged in to update an agent');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.put(`/agents/${id}`, updates);
      
      // Update the agent in the state
      setAgents(prev => prev.map(agent => 
        agent.id === id ? { ...agent, ...response.data } : agent
      ));
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to update agent');
      console.error('Agent error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete agent
  const deleteAgent = async (id: string) => {
    if (!user) {
      throw new Error('You must be logged in to delete an agent');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      await api.delete(`/agents/${id}`);
      
      // Remove the agent from the state
      setAgents(prev => prev.filter(agent => agent.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete agent');
      console.error('Agent error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Duplicate agent
  const duplicateAgent = async (id: string) => {
    if (!user) {
      throw new Error('You must be logged in to duplicate an agent');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.post(`/agents/${id}/duplicate`);
      
      // Add the duplicated agent to the state
      setAgents(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate agent');
      console.error('Agent error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Fetch agents on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchAgents();
    } else {
      setAgents([]);
    }
  }, [user]);

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
