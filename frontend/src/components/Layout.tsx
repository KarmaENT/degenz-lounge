import React from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/router';

interface LayoutProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, requireAuth = false }) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Check if user is authenticated when required
  React.useEffect(() => {
    if (!loading && requireAuth && !user) {
      router.push('/login');
    }
  }, [loading, requireAuth, user, router]);

  // Show loading state
  if (loading && requireAuth) {
    return (
      <div className="min-h-screen bg-background text-text-primary flex items-center justify-center">
        <div className="animate-pulse-slow">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <footer className="bg-background border-t border-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="text-text-secondary text-sm">
              &copy; {new Date().getFullYear()} DeGeNz Lounge. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-text-secondary hover:text-primary">
                Terms
              </a>
              <a href="#" className="text-text-secondary hover:text-primary">
                Privacy
              </a>
              <a href="#" className="text-text-secondary hover:text-primary">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
