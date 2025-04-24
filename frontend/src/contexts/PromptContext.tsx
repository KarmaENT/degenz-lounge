import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

// Types
type Prompt = {
  id: string;
  title: string;
  content: string;
  description: string;
  tags: string[];
  is_public: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

type PromptContextType = {
  prompts: Prompt[];
  loading: boolean;
  error: string | null;
  fetchPrompts: () => Promise<void>;
  createPrompt: (prompt: Omit<Prompt, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<Prompt>;
  updatePrompt: (id: string, updates: Partial<Prompt>) => Promise<Prompt>;
  deletePrompt: (id: string) => Promise<void>;
  duplicatePrompt: (id: string) => Promise<Prompt>;
  clearError: () => void;
};

// Create context
const PromptContext = createContext<PromptContextType | undefined>(undefined);

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Provider component
export function PromptProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
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

  // Fetch prompts
  const fetchPrompts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.get('/prompts');
      setPrompts(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch prompts');
      console.error('Prompt error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create prompt
  const createPrompt = async (prompt: Omit<Prompt, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      throw new Error('You must be logged in to create a prompt');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.post('/prompts', prompt);
      
      // Add the new prompt to the state
      setPrompts(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create prompt');
      console.error('Prompt error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update prompt
  const updatePrompt = async (id: string, updates: Partial<Prompt>) => {
    if (!user) {
      throw new Error('You must be logged in to update a prompt');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.put(`/prompts/${id}`, updates);
      
      // Update the prompt in the state
      setPrompts(prev => prev.map(prompt => 
        prompt.id === id ? { ...prompt, ...response.data } : prompt
      ));
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to update prompt');
      console.error('Prompt error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete prompt
  const deletePrompt = async (id: string) => {
    if (!user) {
      throw new Error('You must be logged in to delete a prompt');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      await api.delete(`/prompts/${id}`);
      
      // Remove the prompt from the state
      setPrompts(prev => prev.filter(prompt => prompt.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete prompt');
      console.error('Prompt error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Duplicate prompt
  const duplicatePrompt = async (id: string) => {
    if (!user) {
      throw new Error('You must be logged in to duplicate a prompt');
    }

    try {
      setLoading(true);
      setError(null);

      const api = createAxiosInstance();
      const response = await api.post(`/prompts/${id}/duplicate`);
      
      // Add the duplicated prompt to the state
      setPrompts(prev => [...prev, response.data]);
      
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to duplicate prompt');
      console.error('Prompt error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Fetch prompts on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchPrompts();
    } else {
      setPrompts([]);
    }
  }, [user]);

  return (
    <PromptContext.Provider
      value={{
        prompts,
        loading,
        error,
        fetchPrompts,
        createPrompt,
        updatePrompt,
        deletePrompt,
        duplicatePrompt,
        clearError,
      }}
    >
      {children}
    </PromptContext.Provider>
  );
}

// Hook to use prompt context
export function usePrompts() {
  const context = useContext(PromptContext);
  if (context === undefined) {
    throw new Error('usePrompts must be used within a PromptProvider');
  }
  return context;
}
