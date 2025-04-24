import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from './auth';

// Types
export type Prompt = {
  id: string;
  title: string;
  content: string;
  description?: string;
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
  updatePrompt: (id: string, prompt: Partial<Prompt>) => Promise<Prompt>;
  deletePrompt: (id: string) => Promise<void>;
  duplicatePrompt: (id: string) => Promise<Prompt>;
  clearError: () => void;
};

// Create context
const PromptContext = createContext<PromptContextType | undefined>(undefined);

// Provider component
export function PromptProvider({ children }: { children: ReactNode }) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch prompts
  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/prompts');
      setPrompts(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch prompts');
      console.error('Error fetching prompts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create prompt
  const createPrompt = async (prompt: Omit<Prompt, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post('/prompts', prompt);
      setPrompts([...prompts, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create prompt');
      console.error('Error creating prompt:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update prompt
  const updatePrompt = async (id: string, prompt: Partial<Prompt>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.put(`/prompts/${id}`, prompt);
      setPrompts(prompts.map(p => p.id === id ? response.data : p));
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update prompt');
      console.error('Error updating prompt:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete prompt
  const deletePrompt = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.delete(`/prompts/${id}`);
      setPrompts(prompts.filter(p => p.id !== id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete prompt');
      console.error('Error deleting prompt:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Duplicate prompt
  const duplicatePrompt = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/prompts/${id}/duplicate`);
      setPrompts([...prompts, response.data]);
      return response.data;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to duplicate prompt');
      console.error('Error duplicating prompt:', err);
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
