import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from './auth';
import { Agent } from './agents';

// Types
export type SandboxSession = {
  id: string;
  name: string;
  configuration: Record<string, any>;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type SandboxAgent = {
  id: string;
  session_id: string;
  agent_id: string;
  position_x: number;
  position_y: number;
  configuration: Record<string, any>;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  sender_type: 'user' | 'agent';
  sender_id: string;
  content: string;
  created_at: string;
  metadata: Record<string, any>;
};

export type ConflictResolution = {
  message_id: string;
  resolution: string;
  score: number;
  alternatives: Array<{
    message_id: string;
    score: number;
  }>;
};

type SandboxContextType = {
  sessions: SandboxSession[];
  currentSession: SandboxSession | null;
  sessionAgents: SandboxAgent[];
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  fetchSessions: () => Promise<void>;
  createSession: (session: Omit<SandboxSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<SandboxSession>;
  updateSession: (id: string, session: Partial<SandboxSession>) => Promise<SandboxSession>;
  deleteSession: (id: string) => Promise<void>;
  setCurrentSession: (session: SandboxSession | null) => void;
  fetchSessionAgents: (sessionId: string) => Promise<void>;
  addAgentToSession: (sessionId: string, agent: Omit<SandboxAgent, 'id' | 'session_id'>) => Promise<SandboxAgent>;
  removeAgentFromSession: (sessionId: string, agentId: string) => Promise<void>;
  updateAgentPosition: (sessionId: string, agentId: string, position: { position_x: number; position_y: number }) => Promise<SandboxAgent>;
  fetchMessages: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, content: string, metadata?: Record<string, any>) => Promise<ChatMessage>;
  clearError: () => void;
};

// Create context
const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

// Provider component
export function SandboxProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<SandboxSession[]>([]);
  const [currentSession, setCurrentSession] = useState<SandboxSession | null>(null);
  const [sessionAgents, setSessionAgents] = useState<SandboxAgent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/sandbox/sessions');
      setSessions(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch sessions');
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create session
  const createSession = async (session: Omit<SandboxSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/sandbox/sessions', session);
      setSessions([...sessions, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create session');
      console.error('Error creating session:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update session
  const updateSession = async (id: string, session: Partial<SandboxSession>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/sandbox/sessions/${id}`, session);
      setSessions(sessions.map(s => s.id === id ? response.data : s));
      if (currentSession?.id === id) {
        setCurrentSession(response.data);
      }
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update session');
      console.error('Error updating session:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete session
  const deleteSession = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/sandbox/sessions/${id}`);
      setSessions(sessions.filter(s => s.id !== id));
      if (currentSession?.id === id) {
        setCurrentSession(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete session');
      console.error('Error deleting session:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch session agents
  const fetchSessionAgents = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/sandbox/sessions/${sessionId}/agents`);
      setSessionAgents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch session agents');
      console.error('Error fetching session agents:', err);
    } finally {
      setLoading(false);
    }
  };

  // Add agent to session
  const addAgentToSession = async (sessionId: string, agent: Omit<SandboxAgent, 'id' | 'session_id'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/sandbox/sessions/${sessionId}/agents`, agent);
      setSessionAgents([...sessionAgents, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add agent to session');
      console.error('Error adding agent to session:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove agent from session
  const removeAgentFromSession = async (sessionId: string, agentId: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/sandbox/sessions/${sessionId}/agents/${agentId}`);
      setSessionAgents(sessionAgents.filter(a => a.id !== agentId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to remove agent from session');
      console.error('Error removing agent from session:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update agent position
  const updateAgentPosition = async (sessionId: string, agentId: string, position: { position_x: number; position_y: number }) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/sandbox/sessions/${sessionId}/agents/${agentId}/position`, position);
      setSessionAgents(sessionAgents.map(a => a.id === agentId ? response.data : a));
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update agent position');
      console.error('Error updating agent position:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages
  const fetchMessages = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/chat/${sessionId}/messages`);
      setMessages(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch messages');
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (sessionId: string, content: string, metadata: Record<string, any> = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/chat/${sessionId}/messages`, { content, metadata });
      setMessages([...messages, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message');
      console.error('Error sending message:', err);
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
    <SandboxContext.Provider
      value={{
        sessions,
        currentSession,
        sessionAgents,
        messages,
        loading,
        error,
        fetchSessions,
        createSession,
        updateSession,
        deleteSession,
        setCurrentSession,
        fetchSessionAgents,
        addAgentToSession,
        removeAgentFromSession,
        updateAgentPosition,
        fetchMessages,
        sendMessage,
        clearError,
      }}
    >
      {children}
    </SandboxContext.Provider>
  );
}

// Hook to use sandbox context
export function useSandbox() {
  const context = useContext(SandboxContext);
  if (context === undefined) {
    throw new Error('useSandbox must be used within a SandboxProvider');
  }
  return context;
}
