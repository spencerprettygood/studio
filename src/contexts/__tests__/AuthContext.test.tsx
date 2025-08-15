import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  signInWithPopup: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
}));

function TestComponent() {
  const { user, login, signup, logout, loading } = useAuth();
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      {user ? (
        <div>
          <span>Logged in as: {user.email}</span>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <button onClick={() => login('test@example.com', 'password123')}>
            Login
          </button>
          <button onClick={() => signup('test@example.com', 'password123', 'Test User')}>
            Signup
          </button>
        </div>
      )}
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides authentication context to children', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByText(/Login/)).toBeInTheDocument();
    expect(screen.getByText(/Signup/)).toBeInTheDocument();
  });

  it('handles user login', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: mockUser,
    } as any);

    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    await user.click(loginButton);

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
    });
  });

  it('handles user signup', async () => {
    const mockUser = { uid: '123', email: 'test@example.com' };
    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
      user: mockUser,
    } as any);

    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const signupButton = screen.getByText('Signup');
    await user.click(signupButton);

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
    });
  });

  it('handles user logout', async () => {
    vi.mocked(signOut).mockResolvedValue(undefined);

    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Simulate logged in state
    const { onAuthStateChanged } = await import('firebase/auth');
    const mockCallback = vi.mocked(onAuthStateChanged).mock.calls[0][1] as Function;
    mockCallback({ uid: '123', email: 'test@example.com' } as any);

    await waitFor(() => {
      expect(screen.getByText(/Logged in as: test@example.com/)).toBeInTheDocument();
    });

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  it('handles authentication errors gracefully', async () => {
    const error = new Error('Invalid credentials');
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(error);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    await user.click(loginButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Login error:', error);
    });

    consoleSpy.mockRestore();
  });
});