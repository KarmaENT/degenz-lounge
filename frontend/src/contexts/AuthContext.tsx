import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, signIn as supabaseSignIn, signUp as supabaseSignUp, signOut as supabaseSignOut, getCurrentUser, getUserProfile } from '@/lib/supabase';

// Types
type User = {
  id: string;
  email: string;
  subscription_tier: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  clearError: () => void;
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabaseUser = await getCurrentUser();
        
        if (supabaseUser) {
          // Get user profile from Supabase
          const profile = await getUserProfile(supabaseUser.id);
          
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            subscription_tier: profile?.subscription_tier || 'basic'
          });
        }
      } catch (err: any) {
        console.error('Auth check failed:', err);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            // Get user profile from Supabase
            const profile = await getUserProfile(session.user.id);
            
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              subscription_tier: profile?.subscription_tier || 'basic'
            });
          } catch (err) {
            console.error('Error getting user profile:', err);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    checkAuth();

    // Clean up subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { user: supabaseUser } = await supabaseSignIn(email, password);
      
      if (supabaseUser) {
        // Get user profile from Supabase
        const profile = await getUserProfile(supabaseUser.id);
        
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          subscription_tier: profile?.subscription_tier || 'basic'
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { user: supabaseUser } = await supabaseSignUp(email, password);
      
      if (supabaseUser) {
        // Create default profile in Supabase
        await supabase.from('profiles').insert({
          id: supabaseUser.id,
          email: supabaseUser.email,
          subscription_tier: 'basic',
          created_at: new Date().toISOString()
        });
        
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          subscription_tier: 'basic'
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      await supabaseSignOut();
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
