import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

// Higher-order component for protected routes
export const withAuth = (WrappedComponent: React.ComponentType<any>) => {
  const WithAuth = (props: any) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Check if user is authenticated
      if (!loading && !user) {
        // Redirect to login page if not authenticated
        router.replace('/login');
      }
    }, [user, loading, router]);

    // Show loading state while checking authentication
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-text-primary">Loading...</div>
        </div>
      );
    }

    // Render the wrapped component if authenticated
    return user ? <WrappedComponent {...props} /> : null;
  };

  return WithAuth;
};

// Higher-order component for subscription-restricted routes
export const withSubscription = (requiredTier: 'basic' | 'pro', WrappedComponent: React.ComponentType<any>) => {
  const WithSubscription = (props: any) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // Check if user is authenticated
      if (!loading && !user) {
        // Redirect to login page if not authenticated
        router.replace('/login');
        return;
      }

      // Check if user has required subscription tier
      if (!loading && user && user.subscription_tier !== requiredTier) {
        // Redirect to upgrade page if subscription tier is insufficient
        router.replace('/subscription/upgrade');
      }
    }, [user, loading, router]);

    // Show loading state while checking authentication and subscription
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-text-primary">Loading...</div>
        </div>
      );
    }

    // Render the wrapped component if authenticated and has required subscription
    return user && user.subscription_tier === requiredTier ? <WrappedComponent {...props} /> : null;
  };

  return WithSubscription;
};
