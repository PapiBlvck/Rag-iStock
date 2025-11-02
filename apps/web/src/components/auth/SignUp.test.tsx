import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, userEvent, screen, waitFor } from '@/test/utils';
import { SignUp } from './SignUp';

// Mock the auth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signup: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('SignUp Component', () => {
  it('renders all form fields', () => {
    const mockOnSwitchToSignIn = vi.fn();
    const mockOnSuccess = vi.fn();

    renderWithProviders(
      <SignUp onSwitchToSignIn={mockOnSwitchToSignIn} onSuccess={mockOnSuccess} />
    );

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const mockOnSwitchToSignIn = vi.fn();
    const mockOnSuccess = vi.fn();

    renderWithProviders(
      <SignUp onSwitchToSignIn={mockOnSwitchToSignIn} onSuccess={mockOnSuccess} />
    );

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    const mockOnSwitchToSignIn = vi.fn();
    const mockOnSuccess = vi.fn();

    renderWithProviders(
      <SignUp onSwitchToSignIn={mockOnSwitchToSignIn} onSuccess={mockOnSuccess} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'invalid-email');
    await userEvent.tab(); // Trigger blur

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates password match', async () => {
    const mockOnSwitchToSignIn = vi.fn();
    const mockOnSuccess = vi.fn();

    renderWithProviders(
      <SignUp onSwitchToSignIn={mockOnSwitchToSignIn} onSuccess={mockOnSuccess} />
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

    await userEvent.type(passwordInput, 'password123');
    await userEvent.type(confirmPasswordInput, 'different123');
    await userEvent.tab(); // Trigger validation

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });
});

