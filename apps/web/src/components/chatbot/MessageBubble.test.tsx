import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/utils';
import { MessageBubble } from './MessageBubble';
import type { RagResponse } from '@istock/shared';

// Mock the hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user123', email: 'test@example.com' },
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/lib/firestore-services', () => ({
  saveMessageFeedback: vi.fn(),
}));

describe('MessageBubble', () => {
  const mockUserMessage = {
    id: '1',
    type: 'user' as const,
    text: 'Hello, this is a user message',
    timestamp: new Date('2024-01-01T10:00:00Z'),
  };

  const mockAiMessage = {
    id: '2',
    type: 'ai' as const,
    text: 'Hello! This is an AI response',
    timestamp: new Date('2024-01-01T10:00:01Z'),
    response: {
      text: 'Hello! This is an AI response',
      sources: [
        { uri: 'https://example.com/source1', title: 'Source 1' },
        { uri: 'https://example.com/source2', title: 'Source 2' },
      ],
      confidence: 0.95,
    } as RagResponse,
  };

  it('renders user message', () => {
    renderWithProviders(<MessageBubble message={mockUserMessage} />);

    expect(screen.getByText('Hello, this is a user message')).toBeInTheDocument();
  });

  it('renders AI message', () => {
    renderWithProviders(<MessageBubble message={mockAiMessage} />);

    expect(screen.getByText('Hello! This is an AI response')).toBeInTheDocument();
  });

  it('displays sources for AI messages', () => {
    renderWithProviders(<MessageBubble message={mockAiMessage} />);

    expect(screen.getByText('Source 1')).toBeInTheDocument();
    expect(screen.getByText('Source 2')).toBeInTheDocument();
  });

  it('displays confidence score for AI messages', () => {
    renderWithProviders(<MessageBubble message={mockAiMessage} />);

    expect(screen.getByText(/95%/)).toBeInTheDocument();
  });

  it('renders message content correctly', () => {
    renderWithProviders(<MessageBubble message={mockUserMessage} />);

    // Message text should be visible
    expect(screen.getByText('Hello, this is a user message')).toBeInTheDocument();
  });
});

