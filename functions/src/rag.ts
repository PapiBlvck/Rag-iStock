// Updated: 2025-11-11 - Fixed Gemini model region and model name
import dotenv from 'dotenv';
import { onRequest, Request } from 'firebase-functions/v2/https';
import { Response } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
// import { getAuth } from 'firebase-admin/auth'; // Uncomment when you enable authentication
import { GoogleAuth } from 'google-auth-library';
import { GoogleGenAI } from '@google/genai';
import * as path from 'path';
import * as functions from 'firebase-functions';
import { handleCorsPreflight, setCorsHeaders } from './cors';

// Load environment variables from .env file (for local development)
// In production, these should be set via Firebase Functions config
// Try multiple paths to find .env file
const envPath = path.join(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error && process.env.NODE_ENV !== 'production') {
  // Only log warning in development, not production
  // In production, environment variables should be set via Firebase config
  console.warn(`Warning: Could not load .env file from ${envPath}. Make sure your .env file exists or set environment variables via Firebase config.`);
}

// Initialize Firebase Admin (only if not already initialized)
if (getApps().length === 0) {
  initializeApp();
}

interface RagRequest {
  prompt: string;
  context?: string;
}

interface RagResponse {
  text: string;
  sources: Array<{ uri: string; title: string }>;
  confidence: number;
}

/**
 * Get RAG Engine configuration from environment variables
 * Supports both new process.env and legacy functions.config() API
 */
function getRagConfig() {
  // Try new environment variables first (for v2 functions)
  let projectId = process.env.RAG_ENGINE_PROJECT_ID;
  let location = process.env.RAG_ENGINE_LOCATION;
  let ragEngineId = process.env.RAG_ENGINE_ID;

  // Fall back to legacy functions.config() API if not set
  if (!projectId || !location || !ragEngineId) {
    try {
      const config = functions.config();
      projectId = projectId || config.rag?.engine_project_id;
      location = location || config.rag?.engine_location;
      ragEngineId = ragEngineId || config.rag?.engine_id;
    } catch (e) {
      // Ignore if config API is not available
    }
  }

  if (!projectId) {
    throw new Error('RAG_ENGINE_PROJECT_ID environment variable is not set');
  }

  if (!location) {
    throw new Error('RAG_ENGINE_LOCATION environment variable is not set');
  }

  if (!ragEngineId) {
    throw new Error('RAG_ENGINE_ID environment variable is not set');
  }

  return { projectId, location, ragEngineId };
}

/**
 * Initialize Google Cloud authentication client
 */
async function getAuthenticatedClient() {
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    projectId: getRagConfig().projectId,
  });
  return await auth.getClient();
}

/**
 * Synthesize a concise answer from retrieved contexts using Vertex AI Generative AI SDK
 */
async function synthesizeAnswer(
  userQuery: string,
  contexts: string[],
  projectId: string,
  location: string
): Promise<string> {
  console.log('=== SYNTHESIS FUNCTION CALLED (rag.ts) ===', {
    userQuery: userQuery.substring(0, 50),
    contextsCount: contexts.length,
    projectId,
    location,
  });
  
  try {
    // Combine contexts (use top 10 for better coverage)
    const combinedContext = contexts
      .slice(0, 10)
      .join('\n\n---\n\n');

    // Create prompt for synthesis - improved to match Google Cloud Console format
    const systemInstruction = `You are a helpful assistant that provides accurate information about livestock health based on veterinary documents. 

When answering questions about diseases or conditions:
- Organize your answer by categories (e.g., Bacterial Diseases, Viral Diseases, Other Conditions)
- List each disease with a brief, clear description
- Use simple, professional language appropriate for farmers
- Do NOT include disclaimers, legal text, document metadata, or formatting instructions
- Focus on providing a comprehensive, well-structured list of the requested information
- For questions asking "what are common X" or "list X", provide a clear, organized list format`;

    // Detect if this is a list-type question
    const isListQuestion = /^(what are|list|name|tell me about|common|types of|kinds of)/i.test(userQuery);
    
    const userPrompt = isListQuestion 
      ? `Based on the following context from veterinary documents, provide a comprehensive, well-organized list answering: ${userQuery}

Context:
${combinedContext}

Format your answer as a clear list with categories where appropriate. Include ALL relevant items from the context. Do not truncate or shorten your answer - provide complete information.`
      : `Based on the following context from veterinary documents, answer this question: ${userQuery}

Context:
${combinedContext}

Provide a clear, well-organized, and COMPLETE answer with specific examples from the context. Do not truncate or shorten your answer - include all relevant information.`;

    // Use Google Gen AI SDK (recommended - replaces deprecated Vertex AI SDK)
    // Try multiple regions and models
    const regionsToTry = ['us-central1', 'us-east1', 'europe-west4'];
    const modelsToTry = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-1.0-pro',
    ];

    let lastError: any = null;

    for (const region of regionsToTry) {
      try {
        console.log(`Trying region: ${region}`, {
          projectId: projectId,
        });

        // Initialize Google Gen AI with Vertex AI backend
        const genAI = new GoogleGenAI({
          vertexai: true, // Use Vertex AI backend
          project: projectId,
          location: region,
        });

        for (const modelName of modelsToTry) {
          try {
            console.log(`Trying Gemini model: ${modelName} in ${region}`);

            // Generate content with timeout - Google Gen AI SDK format
            // Include system instruction in the prompt since SDK may not support it separately
            const fullPrompt = `${systemInstruction}\n\n${userPrompt}`;
            
            const result = await Promise.race([
              genAI.models.generateContent({
                model: modelName,
                contents: fullPrompt,
                config: {
                  maxOutputTokens: 8000,
                  temperature: 0.7,
                  topP: 0.95,
                },
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
              ),
            ]) as any;

            // Extract text - Google Gen AI SDK format
            let text = '';
            // Google Gen AI SDK returns result.text directly or result.response.text
            if (result.text) {
              text = result.text;
            } else if (result.response?.text) {
              text = result.response.text;
            } else if (typeof result.response === 'string') {
              text = result.response;
            } else {
              // Try nested formats
              if (result.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
                text = result.response.candidates[0].content.parts[0].text;
              } else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                text = result.candidates[0].content.parts[0].text;
              }
            }
            
            if (text && text.trim().length > 0) {
              const generatedText = text.trim();
              console.log(`Synthesis successful with ${modelName} in ${region}:`, {
                textLength: generatedText.length,
                preview: generatedText.substring(0, 100),
              });
              return generatedText;
            }
            
            console.warn(`Model ${modelName} in ${region} returned no text, trying next model`);
            continue;
          } catch (error: any) {
            const errorMsg = error.message || String(error);
            console.warn(`Model ${modelName} in ${region} failed:`, errorMsg);
            lastError = { region, model: modelName, error: errorMsg };
            continue; // Try next model
          }
        }
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        console.warn(`Region ${region} initialization failed:`, errorMsg);
        lastError = { region, error: errorMsg };
        continue; // Try next region
      }
    }

    // If all models and regions failed, throw error with details
    throw new Error(`All Gemini models failed. Last error: ${JSON.stringify(lastError)}`);
  } catch (error: any) {
    console.error('LLM synthesis error:', {
      message: error.message,
      stack: error.stack,
      error: error,
    });
    // Enhanced fallback: extract and organize information from all contexts
    return formatContextsAsAnswer(userQuery, contexts);
  }
}

/**
 * Format contexts into a structured answer when LLM synthesis is not available
 * This extracts relevant information and organizes it similar to Google Cloud Console
 */
function formatContextsAsAnswer(query: string, contexts: string[]): string {
  if (contexts.length === 0) {
    return 'Unable to generate answer. Please try rephrasing your question.';
  }

  // Combine and clean contexts
  const combined = contexts.slice(0, 5).join('\n\n---\n\n');
  
  // Remove metadata sections that aren't useful
  let cleaned = combined
    .replace(/Appearance:.*?behaviour\./gs, '')
    .replace(/Natural functions:.*?milk\./gs, '')
    .replace(/Discharges:.*?discharge\./gs, '')
    .replace(/Swellings:.*?appearances\./gs, '')
    .replace(/DISEASE DIAGNOSIS/g, '')
    .replace(/CATEGORIES OF DISEASES/g, '')
    .replace(/CONTROL OF DISEASES/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Extract meaningful sentences
  const sentences = cleaned.split(/[.!?]\s+/).filter(s => s.length > 30 && s.length < 500);
  
  // Use all sentences for a comprehensive answer (no truncation)
  const answer = sentences.join('. ').trim();
  
  if (answer.length < 100) {
    // If still too short, use first context with better formatting
    const firstContext = contexts[0];
    const firstSentences = firstContext.split(/[.!?]\s+/).filter(s => s.length > 30);
    return firstSentences.join('. ').trim();
  }

  return answer;
}

/**
 * Cloud Function to query RAG Engine via Vertex AI
 * 
 * This function:
 * 1. Handles CORS preflight requests (OPTIONS)
 * 2. Calls Google Cloud RAG Engine API
 * 3. Returns formatted response
 * 
 * Environment variables required (in functions/.env or Firebase config):
 * - RAG_ENGINE_PROJECT_ID: Your Google Cloud project ID
 * - RAG_ENGINE_LOCATION: Location of RAG Engine (e.g., europe-west3)
 * - RAG_ENGINE_ID: Your RAG Engine ID
 * 
 * POST /ragQuery
 * Body: { "prompt": "your question here", "context": "optional context" }
 */

export const ragQuery = onRequest(
  {
    region: process.env.RAG_ENGINE_LOCATION || 'europe-west3', // Updated to europe-west3 for new RAG engine
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (req: Request, res: Response) => {
    // ========================================
    // CRITICAL: OPTIONS handling MUST be FIRST
    // ========================================
    // The browser sends OPTIONS preflight BEFORE the actual request
    // This MUST be handled immediately, before ANY other logic
    if (handleCorsPreflight(req, res)) {
      return; // Preflight handled, stop execution
    }

    // ========================================
    // Set CORS headers for actual requests (POST, GET, etc.)
    // ========================================
    const allowedOrigin = setCorsHeaders(req, res);
    
    // For actual requests, if origin is specified and not allowed, reject
    if (req.headers.origin && !allowedOrigin) {
      res.status(403).json({ error: 'Origin not allowed by CORS policy' });
      return;
    }

    // ========================================
    // Handle ACTUAL requests (e.g., POST)
    // ========================================
    
    // Only allow POST requests for actual RAG queries
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    try {
      // Step 1: Optional - Verify Firebase Authentication
      // Uncomment the following section if you want to require authentication
      /*
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authentication required. Please sign in.' });
        return;
      }

      const token = authHeader.split('Bearer ')[1];
      let uid: string;

      try {
        const decodedToken = await getAuth().verifyIdToken(token);
        uid = decodedToken.uid;
      } catch (error: any) {
        res.status(401).json({ error: `Invalid authentication token: ${error.message}` });
        return;
      }
      */

      // Step 2: Validate request data
      const { prompt, context }: RagRequest = req.body;

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Prompt is required and must be a string' });
        return;
      }

      if (prompt.length < 3) {
        res.status(400).json({ error: 'Prompt must be at least 3 characters long' });
        return;
      }

      if (prompt.length > 2000) {
        res.status(400).json({ error: 'Prompt must be less than 2000 characters' });
        return;
      }

      // Step 3: Get configuration
      const { projectId, location, ragEngineId } = getRagConfig();

      // Step 4: Get Google Cloud access token
      const client = await getAuthenticatedClient();
      const accessTokenResponse = await client.getAccessToken();

      if (!accessTokenResponse.token) {
        throw new Error('Failed to obtain access token');
      }

      // Step 5: Call RAG Corpus REST API
      // Using ragCorpora endpoint as per resource name format
      const ragEngineUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/ragCorpora/${ragEngineId}:retrieveContexts`;

      const response = await fetch(ragEngineUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessTokenResponse.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: prompt,
          numContexts: 15, // Increased to 15 for better context coverage
          similarityTopK: 15, // Increased to 15 for better retrieval
          ...(context && { context: context }), // Optional context
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
        console.error('RAG Engine API error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });

        if (response.status === 404) {
          throw new Error('RAG Engine not found. Check your RAG_ENGINE_ID configuration.');
        }
        if (response.status === 403) {
          throw new Error('Permission denied. Check service account permissions.');
        }
        
        throw new Error(`RAG Engine API error (${response.status}): ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json() as {
        contexts?: Array<Record<string, unknown>>;
        contextChunks?: Array<Record<string, unknown>>;
        scores?: number[];
        response?: string;
        confidence?: number;
      };

      // Step 6: Format response with LLM synthesis
      const contexts = data.contexts || data.contextChunks || [];
      const scores = data.scores || [];

      console.log('RAG Engine response:', {
        contextsCount: contexts.length,
        scoresCount: scores.length,
        hasResponse: !!data.response,
      });

      // Extract text from all contexts
      const contextTexts = contexts
        .map((ctx: any) => {
          return ctx.text || ctx.content || ctx.contextText || 
                 ctx.ragContext?.text || ctx.ragContext?.content || '';
        })
        .filter((text: string) => text && String(text).trim().length > 0)
        .map((text: string) => String(text).trim());

      console.log('Extracted context texts:', {
        count: contextTexts.length,
        totalLength: contextTexts.reduce((sum, text) => sum + text.length, 0),
      });

      // Synthesize answer using LLM
      let responseText = 'No response generated';
      if (contextTexts.length > 0) {
        console.log('Synthesizing answer from', contextTexts.length, 'contexts');
        try {
          responseText = await synthesizeAnswer(prompt, contextTexts, projectId, location);
          console.log('Synthesized answer length:', responseText.length);
        } catch (synthesisError: any) {
          console.error('Synthesis failed:', synthesisError);
          // Don't throw, let it fall through to fallback
        }
      }
      
      // Fallback if synthesis didn't work - use enhanced formatting
      if (responseText === 'No response generated' || responseText.length < 50) {
        console.log('Using enhanced fallback formatting');
        responseText = formatContextsAsAnswer(prompt, contextTexts);
      }

      // Deduplicate sources by title
      const sourceMap = new Map<string, { uri: string; title: string }>();
      
      contexts.forEach((ctx: any) => {
        const uri = ctx.sourceUri 
          || ctx.uri 
          || ctx.source?.uri
          || ctx.metadata?.sourceUri
          || ctx.metadata?.source
          || ctx.ragContext?.sourceUri
          || ctx.ragContext?.uri;
        
        const title = ctx.sourceDisplayName
          || ctx.sourceTitle 
          || ctx.title 
          || ctx.source?.title
          || ctx.metadata?.title
          || ctx.ragContext?.title
          || ctx.ragContext?.sourceTitle
          || 'Reference';
        
        // Use title as the deduplication key (or URI if title is generic)
        const key = title !== 'Reference' ? title.toLowerCase().trim() : (uri || 'unknown');
        
        // Only add if we haven't seen this source before and it has valid data
        if (!sourceMap.has(key) && title && title !== 'Reference') {
          const validUri = uri && (uri.startsWith('http://') || uri.startsWith('https://') || uri.startsWith('data:'))
            ? uri
            : `https://rag.istock.local/${encodeURIComponent(title)}`;
          
          sourceMap.set(key, {
            uri: validUri,
            title: title,
          });
        }
      });

      const ragResponse: RagResponse = {
        text: responseText,
        sources: Array.from(sourceMap.values()), // Convert Map to array of unique sources
        confidence: scores.length > 0 
          ? Math.max(...scores)  // Use the maximum score (highest confidence)
          : (data.confidence || 0.8),
      };

      // Log successful request (optional)
      console.log('RAG request successful', {
        promptLength: prompt.length,
        sourcesCount: ragResponse.sources.length,
      });

      // Return success response
      res.status(200).json(ragResponse);
    } catch (error: unknown) {
      const errorObj = error as { message?: string; stack?: string };
      console.error('RAG Engine error:', {
        error: errorObj.message,
        stack: errorObj.stack,
      });

      // Provide user-friendly error messages
      let statusCode = 500;
      let errorMessage = errorObj.message || 'Unknown error occurred';

      if (errorMessage.includes('environment variable')) {
        statusCode = 500;
        errorMessage = `Configuration error: ${errorMessage}`;
      } else if (errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        statusCode = 503;
        errorMessage = 'Network error connecting to RAG Engine. Please try again.';
      } else if (errorMessage.includes('Permission denied')) {
        statusCode = 403;
      } else if (errorMessage.includes('not found')) {
        statusCode = 404;
      }

      // Ensure CORS headers are set on error responses too
      setCorsHeaders(req, res);
      
      res.status(statusCode).json({
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorObj.stack : undefined,
      });
    }
  }
);
