import React from 'react';
import { AuthProvider } from './AuthContext';
import { PaymentProvider } from './PaymentContext';
import { SubscriptionProvider } from './SubscriptionContext';
import { MarketplaceProvider } from './MarketplaceContext';
import { AgentProvider } from './AgentContext';
import { PromptProvider } from './PromptContext';
import { SandboxProvider } from './SandboxContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <PaymentProvider>
          <AgentProvider>
            <PromptProvider>
              <SandboxProvider>
                <MarketplaceProvider>
                  {children}
                </MarketplaceProvider>
              </SandboxProvider>
            </PromptProvider>
          </AgentProvider>
        </PaymentProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
};
