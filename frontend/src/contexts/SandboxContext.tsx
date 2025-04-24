import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

// Types
type SandboxSession = {
  id: string;
  name: string;
  configuration: any;
  user_id: string;
  created_at: string;
  updated_at: string;
};

type SandboxAgent = {
  id: string;
  agent_id: string;
  position_x: number;
  position_y: number;
  configuration: any;
};

type ChatMessage = {
  id: string;
  session_id: string;
  sender_id: string;
  sender_type: 'user' | 'agent';
  content: string;
  created_at: string;
};

type ConflictResolution = {
  id: string;
  session_id: string;
  agent1_id: string;
  agent2_id: string;
  conflict_content: string;
  resolution_content: string | null;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
  updated_at: string;
};

type SandboxContextType = {
  sessions: SandboxSession[];
  currentSession: SandboxSession | null;
  sessionAgents: SandboxAgent[];
  messages: ChatMessage[];
  conflicts: ConflictResolution[];
  loading: boolean;
  error: string | null;
  setCurrentSession: (session: SandboxSession) => void;
  fetchSessions: () => Promise<void>;
  fetchSessionAgents: (sessionId: string) => Promise<void>;
  fetchMessages: (sessionId: string) => Promise<void>;
  fetchConflicts: (sessionId: string) => Promise<void>;
  createSession: (session: Omit<SandboxSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<SandboxSession>;
  deleteSession: (id: string) => Promise<void>;
  addAgentToSession: (sessionId: string, agent: Omit<SandboxAgent, 'id'>) => Promise<SandboxAgent>;
  removeAgentFromSession: (sessionId: string, agentId: string) => Promise<void>;
  updateAgentPosition: (sessionId: string, agentId: string, position: { position_x: number; position_y: number }) => Promise<void>;
  sendMessage: (sessionId: string, content: string) => Promise<void>;
  resolveConflict: (conflictId: string, resolution: string) => Promise<void>;
  clearError: () => void;
};

// Create context
const SandboxContext = createContext<SandboxContextType | undefined>(undefined);

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';

// Provider component
export function SandboxProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SandboxSession[]>([]);
  const [currentSession, setCurrentSession] = useState<SandboxSession | null>(null);
  const [sessionAgents, setSessionAgents] = useState<SandboxAgent[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

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

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      const newSocket = io(SOCKET_URL, {
        auth: {
          token
        }
      });

      setSocket(newSocket);

      // Socket event listeners
      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      newSocket.on('error', (err) => {
        console.error('Socket error:', err);
        setError('Socket connection error');
      });

      // Clean up on unmount
      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket || !currentSession) return;

    // Join session room
    socket.emit('join_session', currentSession.id);

    // Listen for new messages
    socket.on('new_message', (message: ChatMessage) => {
      if (message.session_id === currentSession.id) {
        setMessages(prev => [...prev, message]);
      }
    });

    // Listen for new conflicts
    socket.on('new_conflict', (conflict: ConflictResolution) => {
      if (conflict.session_id === currentSession.id) {
        setConflicts(prev => [...prev, conflict]);
      }
    });

    // Listen for conflict resolutions
    socket.on('conflict_resolved', (resolvedConflict: ConflictResolution) => {
      if (resolvedConflict.session_id === currentSession.id) {
        setConflicts(prev => prev.map(conflict => 
          conflict.id === resolvedConflict.id ? resolvedConflict : conflict
        ));
      }
    });

    // Listen for agent updates
    socket.on('agent_updated', (updatedAgent: SandboxAgent) => {
      setSessionAgents(prev => prev.map(agent => 
        agent.id === updatedAgent.id ? updatedAgent : agent
      ));
    });

    // Listen for agent removals
    socket.on('agent_removed', (agentId: string) => {
      setSessionAgents(prev => prev.filter(agent => agent.id !== agentId));
    });

    // Clean up listeners when session changes
    return () => {
      socket.emit('leave_session', currentSession.id);
      socket.off('new_message');
      socket.off('new_conflict');
      socket.off('conflict_resolved');
      socket.off('agent_updated');
      socket.off('agent_removed');
    };
  }, [socket, currentSession]);

  // Fetch sessions
  const fetchSessions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.get('/sandbox/sessions');
      setSessions(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sessions');
      console.error('Sandbox error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch session agents
  const fetchSessionAgents = async (sessionId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.get(`/sandbox/sessions/${sessionId}/agents`);
      setSessionAgents(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch session agents');
      console.error('Sandbox error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages
  const fetchMessages = async (sessionId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.get(`/sandbox/sessions/${sessionId}/messages`);
      setMessages(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch messages');
      console.error('Sandbox error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch conflicts
  const fetchConflicts = async (sessionId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.get(`/sandbox/sessions/${sessionId}/conflicts`);
      setConflicts(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch conflicts');
      console.error('Sandbox error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create session
  const createSession = async (session: Omit<SandboxSession, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('You must be logged in to create a session');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.post('/sandbox/sessions', session);
      
      // Add the new session to the state
      setSessions(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create session');
      console.error('Sandbox error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete session
  const deleteSession = async (id: string) => {
    if (!user) {
      throw new Error('You must be logged in to delete a session');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      await api.delete(`/sandbox/sessions/${id}`);
      
      // Remove the session from the state
      setSessions(prev => prev.filter(session => session.id !== id));
      
      // Clear current session if it was deleted
      if (currentSession?.id === id) {
        setCurrentSession(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete session');
      console.error('Sandbox error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add agent to session
  const addAgentToSession = async (sessionId: string, agent: Omit<SandboxAgent, 'id'>) => {
    if (!user) {
      throw new Error('You must be logged in to add an agent');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.post(`/sandbox/sessions/${sessionId}/agents`, agent);
      
      // Add the new agent to the state
      setSessionAgents(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to add agent');
      console.error('Sandbox error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Remove agent from session
  const removeAgentFromSession = async (sessionId: string, agentId: string) => {
    if (!user) {
      throw new Error('You must be logged in to remove an agent');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      await api.delete(`/sandbox/sessions/${sessionId}/agents/${agentId}`);
      
      // Remove the agent from the state
      setSessionAgents(prev => prev.filter(agent => agent.id !== agentId));
    } catch (err: any) {
      setError(err.message || 'Failed to remove agent');
      console.error('Sandbox error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update agent position
  const updateAgentPosition = async (sessionId: string, agentId: string, position: { position_x: number; position_y: number }) => {
    if (!user) {
      throw new Error('You must be logged in to update an agent');
    }

    try {
      setError(null);

      // Optimistically update the UI
      setSessionAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, ...position } : agent
      ));

      // Send update to server
      const api = createAxiosInstance();
      await api.patch(`/sandbox/sessions/${sessionId}/agents/${agentId}`, position);
    } catch (err: any) {
      setError(err.message || 'Failed to update agent position');
      console.error('Sandbox error:', err);
      
      // Revert optimistic update on error
      fetchSessionAgents(sessionId);
      throw err;
    }
  };

  // Send message
  const sendMessage = async (sessionId: string, content: string) => {
    if (!user) {
      throw new Error('You must be logged in to send a message');
    }

    try {
      setError(null);

      const api = createAxiosInstance();
      const response = await api.post(`/sandbox/sessions/${sessionId}/messages`, {
        content,
        sender_type: 'user'
      });
      
      // Add the new message to the state
      setMessages(prev => [...prev, response.data]);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      console.error('Sandbox error:', err);
      throw err;
    }
  };

  // Resolve conflict
  const resolveConflict = async (conflictId: string, resolution: string) => {
    if (!user) {
      throw new Error('You must be logged in to resolve a conflict');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.post(`/sandbox/conflicts/${conflictId}/resolve`, {
        resolution
      });
      
      // Update the conflict in the state
      setConflicts(prev => prev.map(conflict => 
        conflict.id === conflictId ? response.data : conflict
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to resolve conflict');
      console.error('Sandbox error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Fetch sessions on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchSessions();
    } else {
      setSessions([]);
      setCurrentSession(null);
      setSessionAgents([]);
      setMessages([]);
      setConflicts([]);
    }
  }, [user]);

  return (
    <SandboxContext.Provider
      value={{
        sessions,
        currentSession,
        sessionAgents,
        messages,
        conflicts,
        loading,
        error,
        setCurrentSession,
        fetchSessions,
        fetchSessionAgents,
        fetchMessages,
        fetchConflicts,
        createSession,
        deleteSession,
        addAgentToSession,
        removeAgentFromSession,
        updateAgentPosition,
        sendMessage,
        resolveConflict,
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
