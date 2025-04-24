import React from 'react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useRouter } from 'next/router';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = () => {
    signOut();
    router.push('/login');
  };

  return (
    <nav className="bg-background border-b border-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary">
                DeGeNz Lounge
              </Link>
            </div>
            {user && (
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link 
                  href="/dashboard" 
                  className={`${
                    router.pathname === '/dashboard' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-text-secondary hover:border-gray-300 hover:text-text-primary'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Dashboard
                </Link>
                <Link 
                  href="/agents" 
                  className={`${
                    router.pathname.startsWith('/agents') 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-text-secondary hover:border-gray-300 hover:text-text-primary'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Agents
                </Link>
                <Link 
                  href="/prompts" 
                  className={`${
                    router.pathname.startsWith('/prompts') 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-text-secondary hover:border-gray-300 hover:text-text-primary'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Prompts
                </Link>
                <Link 
                  href="/sandbox" 
                  className={`${
                    router.pathname.startsWith('/sandbox') 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-text-secondary hover:border-gray-300 hover:text-text-primary'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Sandbox
                </Link>
                <Link 
                  href="/marketplace" 
                  className={`${
                    router.pathname.startsWith('/marketplace') 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-text-secondary hover:border-gray-300 hover:text-text-primary'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Marketplace
                </Link>
              </div>
            )}
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <div className="ml-3 relative flex items-center space-x-4">
                <Link 
                  href="/profile" 
                  className="text-text-secondary hover:text-text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-text-secondary hover:text-text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link 
                  href="/login" 
                  className="text-text-secondary hover:text-text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Log in
                </Link>
                <Link 
                  href="/register" 
                  className="bg-primary text-white hover:bg-primary/90 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className="hidden h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className="sm:hidden" id="mobile-menu">
        {user && (
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              href="/dashboard" 
              className={`${
                router.pathname === '/dashboard' 
                  ? 'bg-surface text-primary border-l-4 border-primary' 
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary border-l-4 border-transparent'
              } block pl-3 pr-4 py-2 text-base font-medium`}
            >
              Dashboard
            </Link>
            <Link 
              href="/agents" 
              className={`${
                router.pathname.startsWith('/agents') 
                  ? 'bg-surface text-primary border-l-4 border-primary' 
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary border-l-4 border-transparent'
              } block pl-3 pr-4 py-2 text-base font-medium`}
            >
              Agents
            </Link>
            <Link 
              href="/prompts" 
              className={`${
                router.pathname.startsWith('/prompts') 
                  ? 'bg-surface text-primary border-l-4 border-primary' 
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary border-l-4 border-transparent'
              } block pl-3 pr-4 py-2 text-base font-medium`}
            >
              Prompts
            </Link>
            <Link 
              href="/sandbox" 
              className={`${
                router.pathname.startsWith('/sandbox') 
                  ? 'bg-surface text-primary border-l-4 border-primary' 
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary border-l-4 border-transparent'
              } block pl-3 pr-4 py-2 text-base font-medium`}
            >
              Sandbox
            </Link>
            <Link 
              href="/marketplace" 
              className={`${
                router.pathname.startsWith('/marketplace') 
                  ? 'bg-surface text-primary border-l-4 border-primary' 
                  : 'text-text-secondary hover:bg-surface hover:text-text-primary border-l-4 border-transparent'
              } block pl-3 pr-4 py-2 text-base font-medium`}
            >
              Marketplace
            </Link>
          </div>
        )}
        <div className="pt-4 pb-3 border-t border-surface">
          {user ? (
            <div className="space-y-1">
              <Link 
                href="/profile" 
                className="block pl-3 pr-4 py-2 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface"
              >
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left pl-3 pr-4 py-2 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <Link 
                href="/login" 
                className="block pl-3 pr-4 py-2 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface"
              >
                Log in
              </Link>
              <Link 
                href="/register" 
                className="block pl-3 pr-4 py-2 text-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
