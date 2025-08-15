import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { vi } from 'vitest';

// Create a custom render function that includes providers
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface TestProviderProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: TestProviderProps) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock data generators
export const generateMockPrompt = (overrides = {}) => ({
  id: 'test-id-' + Math.random(),
  name: 'Test Prompt',
  description: 'A test prompt description',
  template: 'This is a {{variable}} template',
  tags: ['test', 'mock'],
  category: 'Testing',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  userId: 'test-user-id',
  ...overrides,
});

export const generateMockUser = (overrides = {}) => ({
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
  emailVerified: true,
  ...overrides,
});

// Utility to wait for async operations
export const waitForLoadingToFinish = () =>
  vi.waitFor(
    () => {
      const loaders = [
        ...document.querySelectorAll('[aria-busy="true"]'),
        ...document.querySelectorAll('[data-testid="loading"]'),
      ];
      if (loaders.length > 0) {
        throw new Error('Still loading');
      }
    },
    { timeout: 3000 }
  );

// Mock Firebase auth state
export const mockAuthState = (user: any = null) => {
  const { onAuthStateChanged } = require('firebase/auth');
  vi.mocked(onAuthStateChanged).mockImplementation((auth: any, callback: Function) => {
    callback(user);
    return () => {};
  });
};

// Mock Firestore operations
export const mockFirestoreCollection = (data: any[] = []) => {
  const { collection, getDocs } = require('firebase/firestore');
  
  vi.mocked(getDocs).mockResolvedValue({
    docs: data.map(item => ({
      id: item.id,
      data: () => item,
    })),
    empty: data.length === 0,
    size: data.length,
  } as any);
  
  return { collection, getDocs };
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
export { default as userEvent } from '@testing-library/user-event';