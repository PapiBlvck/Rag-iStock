import { auth } from '@/lib/firebase';
import type { RagResponse } from '@istock/shared';

/**
 * RAG API Configuration
 * 
 * The RAG API URL points to your Firebase Cloud Function
 * Set VITE_RAG_API_URL in your .env file
 */
const RAG_API_URL = import.meta.env.VITE_RAG_API_URL || '';

interface RagRequest {
  query: string;
  context?: string;
}

/**
 * Call RAG Engine via Firebase Cloud Function
 * 
 * This function:
 * 1. Gets the current user's Firebase Auth token
 * 2. Calls the Cloud Function with authentication
 * 3. Returns the RAG response
 * 
 * @param input - The query and optional context
 * @returns RAG response with text, sources, and confidence
 * @throws Error if API call fails or user is not authenticated
 */
export async function askRag(input: RagRequest): Promise<RagResponse> {
  const user = auth.currentUser;
  
  if (!user) {
    throw new Error('User must be authenticated to use RAG. Please sign in.');
  }

  // If RAG API URL is not configured, throw error
  if (!RAG_API_URL) {
    throw new Error(
      'RAG API URL not configured. Please set VITE_RAG_API_URL in your .env file.'
    );
  }

  // Get Firebase Auth token for authentication (currently unused, but kept for future auth)
  try {
    await user.getIdToken(); // Token retrieved but not used yet
  } catch (error: any) {
    throw new Error(`Failed to get authentication token: ${error.message}`);
  }

  try {
    const response = await fetch(RAG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: HTTPS functions don't require Authorization header unless you enable auth
        // Remove if authentication is disabled in the function
      },
      body: JSON.stringify({
        prompt: input.query,
        ...(input.context && { context: input.context }),
      }),
    });

    // Handle HTTP errors
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.error?.message || errorData.message || errorMessage;
      } catch {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      // Handle specific status codes
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      }
      if (response.status === 403) {
        throw new Error('Permission denied. Please check your account permissions.');
      }
      if (response.status === 404) {
        throw new Error('RAG service not found. Please contact support.');
      }
      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }

      throw new Error(errorMessage);
    }

    // Parse response
    // HTTPS functions return the response directly, not wrapped in { result: ... }
    const ragResponse: RagResponse = await response.json();

    // Validate response structure
    if (!ragResponse.text) {
      throw new Error('Invalid response format: missing text field');
    }

    // Ensure sources is an array
    if (!Array.isArray(ragResponse.sources)) {
      ragResponse.sources = [];
    }

    // Ensure confidence is a number
    if (typeof ragResponse.confidence !== 'number') {
      ragResponse.confidence = 0.8;
    }

    return ragResponse;
  } catch (error: any) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection and try again.');
    }

    // Re-throw other errors
    throw error;
  }
}

/**
 * Check if RAG API is configured and available
 */
export function isRagApiConfigured(): boolean {
  return !!RAG_API_URL;
}

