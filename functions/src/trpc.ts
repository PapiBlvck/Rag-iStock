// Updated: 2025-11-11 - Fixed Gemini model region and model name
import dotenv from 'dotenv';
import { onRequest, Request } from 'firebase-functions/v2/https';
import { Response } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import { VertexRagServiceClient } from '@google-cloud/aiplatform';
import { GoogleAuth } from 'google-auth-library';
import * as path from 'path';
import * as functions from 'firebase-functions';
import { handleCorsPreflight, setCorsHeaders } from './cors';

// Load environment variables from .env file (for local development)
// In production, these should be set via Firebase Functions config
const envPath = path.join(__dirname, '..', '.env');
const result = dotenv.config({ path: envPath });

if (result.error && process.env.NODE_ENV !== 'production') {
  console.warn(`Warning: Could not load .env file from ${envPath}. Make sure your .env file exists or set environment variables via Firebase config.`);
}

// Initialize Firebase Admin (only if not already initialized)
if (getApps().length === 0) {
  initializeApp();
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
 * Initialize Vertex RAG Service client
 */
function getVertexRagClient(projectId: string, location: string) {
  return new VertexRagServiceClient({
    apiEndpoint: `${location}-aiplatform.googleapis.com`,
    projectId: projectId,
  });
}


/**
 * Synthesize a concise answer from retrieved contexts using Vertex AI Generative AI (Gemini) via REST API
 */
async function synthesizeAnswer(
  userQuery: string,
  contexts: string[],
  projectId: string,
  location: string
): Promise<string> {
  console.log('=== SYNTHESIS FUNCTION CALLED ===', {
    userQuery: userQuery.substring(0, 50),
    contextsCount: contexts.length,
    projectId,
    location,
    firstContextLength: contexts[0]?.length || 0,
    firstContextPreview: contexts[0]?.substring(0, 100) || 'N/A',
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

Format your answer as a clear list with categories where appropriate. Include all relevant items from the context.`
      : `Based on the following context from veterinary documents, answer this question: ${userQuery}

Context:
${combinedContext}

Provide a clear, well-organized answer with specific examples from the context.`;

    // Combine system instruction and user prompt (define once, used by both Vertex AI and Gemini API)
    const fullPrompt = `${systemInstruction}\n\n${userPrompt}`;

    // Use Vertex AI REST API directly (more reliable than Google Gen AI SDK)
    // Try multiple regions and models - start with europe-west3 where RAG corpus is
    // Note: Gemini models may not be available in all regions
    const regionsToTry = ['europe-west3', 'us-central1', 'us-east1'];
    const modelsToTry = [
      'gemini-1.5-pro-002',  // Try versioned models first (more reliable)
      'gemini-1.5-flash-002',
      'gemini-1.5-pro',       // Fallback to unversioned
      'gemini-1.5-flash',
      'gemini-1.0-pro',
      'gemini-pro',           // Legacy model name
    ];

    // Get authentication token
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });

    let lastError: any = null;

    for (const region of regionsToTry) {
      try {
        console.log(`tRPC - ===== TRYING REGION: ${region} =====`, {
          projectId: projectId,
          regionIndex: regionsToTry.indexOf(region) + 1,
          totalRegions: regionsToTry.length,
        });

        // Get access token for this region
        console.log(`tRPC - Getting access token for ${region}...`);
        const accessToken = await auth.getAccessToken();
        if (!accessToken) {
          console.error(`tRPC - Failed to get access token for ${region}`);
          throw new Error('Failed to get access token');
        }
        console.log(`tRPC - Access token obtained for ${region} (length: ${accessToken?.length || 0})`);

        for (const modelName of modelsToTry) {
          try {
            console.log(`tRPC - Trying Gemini model: ${modelName} in ${region}`);

            // Use Vertex AI REST API directly
            // Try both publisher model format and direct model format
            let apiUrl = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${modelName}:generateContent`;
            
            // For europe-west3, models might be in a different format
            // If this fails, we'll try alternative formats in the catch block

            console.log(`tRPC - Calling Vertex AI REST API for ${modelName}...`);
            
            const fetchResponse = await Promise.race([
              fetch(apiUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contents: [{
                    parts: [{ text: fullPrompt }]
                  }],
                  generationConfig: {
                    maxOutputTokens: 2000,
                    temperature: 0.7,
                    topP: 0.95,
                  },
                }),
              }),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
              ),
            ]);

            if (!fetchResponse.ok) {
              const errorText = await fetchResponse.text();
              let errorData: any;
              try {
                errorData = JSON.parse(errorText);
              } catch {
                errorData = { error: errorText };
              }
              throw new Error(JSON.stringify(errorData));
            }

            const result = await fetchResponse.json() as any;
            console.log(`tRPC - Received response from ${modelName}, checking structure...`);

            // Extract text from Vertex AI response format
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text && text.trim().length > 0) {
              const generatedText = text.trim();
              console.log(`tRPC - Synthesis successful with ${modelName} in ${region}:`, {
                textLength: generatedText.length,
                preview: generatedText.substring(0, 100),
              });
              return generatedText;
            }
            
            console.warn(`tRPC - Model ${modelName} in ${region} returned no text, trying next model`);
            continue;
          } catch (error: any) {
            const errorMsg = error.message || String(error);
            const errorStr = String(errorMsg);
            
            // If 404, try alternative API format for any region
            if (errorStr.includes('404')) {
              console.log(`tRPC - Trying alternative API format for ${modelName} in ${region}...`);
              try {
                // Try without publisher path (direct model access)
                const altApiUrl = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/models/${modelName}:generateContent`;
                
                const altResponse = await Promise.race([
                  fetch(altApiUrl, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${accessToken}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      contents: [{
                        parts: [{ text: fullPrompt }]
                      }],
                      generationConfig: {
                        maxOutputTokens: 2000,
                        temperature: 0.7,
                        topP: 0.95,
                      },
                    }),
                  }),
                  new Promise<never>((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
                  ),
                ]);

                if (altResponse.ok) {
                  const altResult = await altResponse.json() as any;
                  const altText = altResult.candidates?.[0]?.content?.parts?.[0]?.text;
                  
                  if (altText && altText.trim().length > 0) {
                    const generatedText = altText.trim();
                    console.log(`tRPC - Synthesis successful with ${modelName} in ${region} (alternative format):`, {
                      textLength: generatedText.length,
                      preview: generatedText.substring(0, 100),
                    });
                    return generatedText;
                  }
                }
              } catch (altError: any) {
                console.warn(`tRPC - Alternative format also failed for ${modelName} in ${region}`);
              }
            }
            
            console.error(`tRPC - Model ${modelName} in ${region} failed:`, {
              error: errorMsg,
              stack: error.stack,
              errorType: error.constructor?.name,
            });
            lastError = { region, model: modelName, error: errorMsg, errorType: error.constructor?.name };
            continue; // Try next model
          }
        }
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        console.error(`tRPC - Region ${region} failed:`, {
          region,
          error: errorMsg,
          stack: error.stack,
          errorType: error.constructor?.name,
        });
        lastError = { region, error: errorMsg };
        continue; // Try next region
      }
    }

    // If all Vertex AI models failed, try Gemini API directly as fallback
    // Check both process.env and Firebase config (for backward compatibility)
    const geminiApiKey = process.env.GEMINI_API_KEY || (functions.config().gemini?.api_key as string | undefined);
    if (geminiApiKey) {
      console.log('tRPC - All Vertex AI models failed, trying Gemini API directly...');
      try {
        // First, list available models to see what's actually available
        try {
          const listModelsUrl = `https://generativelanguage.googleapis.com/v1/models?key=${geminiApiKey}`;
          const listResponse = await fetch(listModelsUrl);
          if (listResponse.ok) {
            const modelsList = await listResponse.json() as any;
            const availableModels = modelsList.models?.map((m: any) => m.name?.replace('models/', '') || m.name) || [];
            console.log('tRPC - Available Gemini API models:', availableModels);
          }
        } catch (listError) {
          console.warn('tRPC - Could not list models, using default list');
        }
        
        // Use Gemini API directly (not Vertex AI)
        // Use the actual available models from the API
        const geminiModels = [
          'gemini-2.5-pro',        // Best quality
          'gemini-2.5-flash',      // Fast and good quality
          'gemini-2.0-flash',      // Alternative
          'gemini-2.0-flash-001',  // Versioned
        ];
        
        for (const modelName of geminiModels) {
          try {
            console.log(`tRPC - Trying Gemini API model: ${modelName}`);
            
            // Gemini API uses different endpoint format
            const geminiApiUrl = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${geminiApiKey}`;
            
            const geminiResponse = await Promise.race([
              fetch(geminiApiUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  contents: [{
                    parts: [{ text: fullPrompt }]
                  }],
                  generationConfig: {
                    maxOutputTokens: 2000,
                    temperature: 0.7,
                    topP: 0.95,
                  },
                }),
              }),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
              ),
            ]);

            if (geminiResponse.ok) {
              const geminiResult = await geminiResponse.json() as any;
              console.log('tRPC - Gemini API response structure:', {
                hasCandidates: !!geminiResult.candidates,
                hasText: !!geminiResult.text,
                keys: Object.keys(geminiResult || {}),
              });
              
              // Try multiple response formats
              let geminiText = '';
              if (geminiResult.candidates?.[0]?.content?.parts?.[0]?.text) {
                geminiText = geminiResult.candidates[0].content.parts[0].text;
              } else if (geminiResult.text) {
                geminiText = geminiResult.text;
              } else if (geminiResult.response?.text) {
                geminiText = geminiResult.response.text;
              }
              
              if (geminiText && geminiText.trim().length > 0) {
                const generatedText = geminiText.trim();
                console.log(`tRPC - Synthesis successful with Gemini API ${modelName}:`, {
                  textLength: generatedText.length,
                  preview: generatedText.substring(0, 100),
                });
                return generatedText;
              } else {
                console.warn(`tRPC - Gemini API ${modelName} returned no text. Response:`, JSON.stringify(geminiResult).substring(0, 200));
              }
            } else {
              const errorText = await geminiResponse.text();
              console.warn(`tRPC - Gemini API ${modelName} failed: ${geminiResponse.status} - ${errorText}`);
            }
          } catch (geminiError: any) {
            console.warn(`tRPC - Gemini API ${modelName} error:`, geminiError.message);
            continue;
          }
        }
      } catch (fallbackError: any) {
        console.error('tRPC - Gemini API fallback also failed:', fallbackError.message);
      }
    } else {
      console.warn('tRPC - GEMINI_API_KEY not set, skipping Gemini API fallback');
    }

    // If all models and regions failed, throw error with details
    throw new Error(`All Gemini models failed. Last error: ${JSON.stringify(lastError)}`);
  } catch (error: any) {
    console.error('LLM synthesis error:', error);
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
  
  // Take first 15-20 sentences for a comprehensive answer
  const answer = sentences.slice(0, 20).join('. ').trim();
  
  if (answer.length < 100) {
    // If still too short, use first context with better formatting
    const firstContext = contexts[0];
    const firstSentences = firstContext.split(/[.!?]\s+/).filter(s => s.length > 30);
    return firstSentences.slice(0, 10).join('. ').trim() + (firstSentences.length > 10 ? '...' : '');
  }

  return answer + (sentences.length > 20 ? '...' : '');
}

/**
 * tRPC endpoint handler for RAG queries
 * 
 * This function:
 * 1. Handles CORS preflight requests (OPTIONS)
 * 2. Parses tRPC-style requests
 * 3. Calls Google Cloud RAG Engine API
 * 4. Returns formatted response
 * 
 * Environment variables required (in functions/.env or Firebase config):
 * - RAG_ENGINE_PROJECT_ID: Your Google Cloud project ID
 * - RAG_ENGINE_LOCATION: Location of RAG Engine (e.g., europe-west3)
 * - RAG_ENGINE_ID: Your RAG Engine ID
 * 
 * POST /trpc
 * Body: { "prompt": "your question here", "context": "optional context" }
 */
export const trpc = onRequest(
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
    if (handleCorsPreflight(req, res)) {
      return; // Preflight handled, stop execution
    }

    // ========================================
    // Set CORS headers for actual requests
    // ========================================
    const allowedOrigin = setCorsHeaders(req, res);
    
    if (req.headers.origin && !allowedOrigin) {
      res.status(403).json({ error: 'Origin not allowed by CORS policy' });
      return;
    }

    // ========================================
    // Handle ACTUAL requests (e.g., POST)
    // ========================================
    
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    try {
      // Parse the request path for tRPC routing (if needed)
      const path = req.path || '';
      console.log('tRPC Handler - Parsed path:', path);
      
      // If path contains procedure name (e.g., /health/askRag), extract it but don't require it
      // The current implementation doesn't require procedure names in the path
      
      console.log('tRPC Handler - Content-Type:', req.headers['content-type']);
      console.log('tRPC Handler - Request method:', req.method);
      console.log('tRPC Handler - Request body type:', typeof req.body);
      console.log('tRPC Handler - Raw body exists:', !!req.body);
      console.log('tRPC Handler - Body is object:', typeof req.body === 'object');
      console.log('tRPC Handler - Body is string:', typeof req.body === 'string');

      // Parse request body
      // Frontend sends: { prompt: string, context?: string }
      // Firebase Functions v2 may auto-parse JSON, but handle both cases
      let body: any = {};
      
      if (req.body) {
        // If body is already parsed (object)
        if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
          body = req.body;
        } else if (typeof req.body === 'string') {
          // If body is a string, parse it
          try {
            body = JSON.parse(req.body);
          } catch (e) {
            console.error('Failed to parse body as JSON:', e);
            res.status(400).json({ error: 'Invalid JSON in request body' });
            return;
          }
        }
      } else {
        // Body might be in raw format - try to read it
        // For Firebase Functions v2, body should be auto-parsed, but check anyway
        console.warn('Request body is empty or undefined');
        res.status(400).json({ error: 'Request body is required' });
        return;
      }
      
      console.log('tRPC Handler - Parsed body:', JSON.stringify(body));
      console.log('tRPC Handler - Body keys:', Object.keys(body || {}));
      console.log('tRPC Handler - Extracting prompt from body...');
      console.log('tRPC Handler - Body.prompt:', body.prompt);
      console.log('tRPC Handler - Body.prompt type:', typeof body.prompt);

      let prompt: string;
      let context: string | undefined;

      // Handle different request formats
      // Frontend may send: { procedure: 'health.askRag', prompt: string, context?: string }
      // We ignore the procedure field and extract prompt
      if (body.prompt) {
        // Direct format: { prompt: string, context?: string }
        // Also handles: { procedure: string, prompt: string, context?: string }
        prompt = body.prompt;
        context = body.context;
        console.log('tRPC Handler - Prompt extracted:', prompt);
        console.log('tRPC Handler - Context:', context);
        if (body.procedure) {
          console.log('tRPC Handler - Procedure field received (ignored):', body.procedure);
        }
      } else if (body.query) {
        // Alternative format: { query: string, context?: string }
        prompt = body.query;
        context = body.context;
      } else if (body.data?.prompt) {
        // Wrapped format: { data: { prompt: string, context?: string } }
        prompt = body.data.prompt;
        context = body.data.context;
      } else if (body.data?.query) {
        // Wrapped format: { data: { query: string, context?: string } }
        prompt = body.data.query;
        context = body.data.context;
      } else {
        console.error('tRPC Handler - Invalid request body format:', body);
        res.status(400).json({ 
          error: 'Invalid request format. Expected { prompt: string, context?: string }',
          received: body 
        });
        return;
      }

      // Validate prompt
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

      console.log('tRPC Handler - Prompt validated, length:', prompt.length);
      console.log('tRPC Handler - About to get RAG config...');

      // Get configuration
      let projectId: string;
      let location: string;
      let ragEngineId: string;
      
      try {
        const config = getRagConfig();
        projectId = config.projectId;
        location = config.location;
        ragEngineId = config.ragEngineId;
        console.log('tRPC Handler - RAG Config retrieved successfully');
      } catch (error: any) {
        console.error('tRPC Handler - Error getting RAG config:', error);
        console.error('tRPC Handler - Error stack:', error.stack);
        throw error;
      }
      
      console.log('tRPC Handler - RAG Config:', {
        projectId,
        location,
        ragEngineId,
        timestamp: new Date().toISOString(),
      });
      
      // Verify we're using the correct corpus ID (europe-west3 RAG engine)
      if (ragEngineId !== '6917529027641081856') {
        console.warn('Using RAG Engine ID:', ragEngineId, 'Expected: 6917529027641081856 (europe-west3)');
      }

      // Use Vertex AI SDK instead of REST API for better reliability
      console.log('tRPC Handler - Using Vertex AI SDK to query RAG corpus...');
      
      const ragClient = getVertexRagClient(projectId, location);
      const parent = `projects/${projectId}/locations/${location}`;
      const ragCorpusName = `projects/${projectId}/locations/${location}/ragCorpora/${ragEngineId}`;
      
      console.log('tRPC Handler - Parent:', parent);
      console.log('tRPC Handler - RAG Corpus name:', ragCorpusName);
      
      try {
        // Use the Vertex AI SDK to retrieve contexts
        // The SDK handles the correct endpoint format automatically
        const result = await ragClient.retrieveContexts({
          parent: parent,
          query: {
            text: prompt,
            // Note: context parameter might not be supported in the query object
            // If needed, it might need to be passed differently
          },
          vertexRagStore: {
            ragResources: [{
              ragCorpus: ragCorpusName,
            }],
          },
        });

        // The result is a Promise that resolves to an array
        const [response] = await result;
        console.log('tRPC Handler - Vertex AI SDK response received');
        console.log('tRPC Handler - Response keys:', Object.keys(response || {}));
        console.log('tRPC Handler - Response structure:', JSON.stringify(response, null, 2));
        
        // Format response from SDK
        // The Vertex AI SDK response structure may vary - try multiple possible formats
        // Use type assertion to handle dynamic response structure
        const responseAny = response as any;
        let contextsArray: any[] = [];
        let scores: number[] = [];
        
        // Handle nested contexts structure: response.contexts.contexts
        if (responseAny.contexts) {
          if (Array.isArray(responseAny.contexts)) {
            // Direct array: response.contexts = [...]
            contextsArray = responseAny.contexts;
          } else if (responseAny.contexts.contexts && Array.isArray(responseAny.contexts.contexts)) {
            // Nested structure: response.contexts.contexts = [...]
            contextsArray = responseAny.contexts.contexts;
          } else if (responseAny.contexts.contexts) {
            // Single nested context
            contextsArray = [responseAny.contexts.contexts];
          } else {
            // Single context object
            contextsArray = [responseAny.contexts];
          }
        } else if (responseAny.ragContexts && Array.isArray(responseAny.ragContexts)) {
          contextsArray = responseAny.ragContexts;
        } else if (responseAny.ragContexts) {
          contextsArray = [responseAny.ragContexts];
        } else if (responseAny.contextChunks && Array.isArray(responseAny.contextChunks)) {
          contextsArray = responseAny.contextChunks;
        } else if (responseAny.contextChunks) {
          contextsArray = [responseAny.contextChunks];
        }
        
        // Extract scores - check nested structure too
        if (responseAny.scores && Array.isArray(responseAny.scores)) {
          scores = responseAny.scores;
        } else if (responseAny.contexts?.scores && Array.isArray(responseAny.contexts.scores)) {
          scores = responseAny.contexts.scores;
        } else if (responseAny.similarityScores && Array.isArray(responseAny.similarityScores)) {
          scores = responseAny.similarityScores;
        } else if (contextsArray.length > 0) {
          // Extract scores from individual contexts if they have score field
          scores = contextsArray
            .map((ctx: any) => ctx.score || ctx._score)
            .filter((score: any) => typeof score === 'number')
            .slice(0, 5); // Limit to top 5
        }
        
        console.log('tRPC Handler - Extracted contexts count:', contextsArray.length);
        console.log('tRPC Handler - Extracted scores count:', scores.length);
        if (contextsArray.length > 0) {
          console.log('tRPC Handler - First context structure:', JSON.stringify(contextsArray[0], null, 2));
          console.log('tRPC Handler - First context keys:', Object.keys(contextsArray[0] || {}));
        }

        // Extract contexts and synthesize answer using LLM
        let responseText = 'No response generated';
        // Extract text from all contexts (outside if block for fallback access)
        const contextTexts = contextsArray
          .map((ctx: any) => {
            return ctx.text || ctx.content || ctx.contextText || 
                   ctx.ragContext?.text || ctx.ragContext?.content || '';
          })
          .filter((text: string) => text && String(text).trim().length > 0)
          .map((text: string) => String(text).trim());
        
        // DIAGNOSTIC LOGGING: Check why synthesis might not be called
        console.log('tRPC Handler - contextTexts extraction result:', {
          contextsArrayLength: contextsArray.length,
          contextTextsLength: contextTexts.length,
          firstContextKeys: contextsArray[0] ? Object.keys(contextsArray[0]) : [],
          firstContextHasText: !!(contextsArray[0]?.text),
          firstContextTextLength: contextsArray[0]?.text?.length || 0,
          firstContextTextPreview: contextsArray[0]?.text?.substring(0, 100) || 'N/A',
          sampleContextStructure: contextsArray[0] ? {
            hasText: !!contextsArray[0].text,
            hasContent: !!contextsArray[0].content,
            hasContextText: !!contextsArray[0].contextText,
            hasRagContext: !!contextsArray[0].ragContext,
            keys: Object.keys(contextsArray[0]),
          } : null,
        });
        
        if (contextTexts.length > 0) {
          console.log('tRPC Handler - Synthesizing answer from', contextTexts.length, 'contexts');
          console.log('tRPC Handler - About to call synthesizeAnswer with:', {
            promptLength: prompt.length,
            contextsCount: contextTexts.length,
            projectId,
            location,
          });
          try {
            // Use LLM to synthesize a concise, well-structured answer
            responseText = await synthesizeAnswer(prompt, contextTexts, projectId, location);
            console.log('tRPC Handler - Synthesized answer length:', responseText.length);
            console.log('tRPC Handler - Synthesized answer preview:', responseText.substring(0, 200));
          } catch (synthesisError: any) {
            console.error('tRPC Handler - Synthesis failed with error:', {
              message: synthesisError.message,
              stack: synthesisError.stack,
              error: synthesisError,
            });
            // Will fall through to enhanced fallback
          }
        }
        
        // Fallback if synthesis didn't work - use enhanced formatting
        if (responseText === 'No response generated' || responseText.length < 50) {
          console.log('tRPC Handler - Using enhanced fallback formatting');
          responseText = formatContextsAsAnswer(prompt, contextTexts);
        }
        
        console.log('tRPC Handler - Final responseText length:', responseText.length);
        
        // Deduplicate sources by title (or URI if title is generic)
        const sourceMap = new Map<string, { uri: string; title: string }>();
        
        contextsArray.forEach((ctx: any) => {
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
        
        // Convert markdown to HTML for styled display (without visible markdown markers)
        // Process line by line to handle different markdown elements properly
        const lines = responseText.split('\n');
        const htmlLines: string[] = [];
        let inList = false;
        let currentParagraph: string[] = [];
        
        const flushParagraph = () => {
          if (currentParagraph.length > 0) {
            const paraText = currentParagraph.join(' ').trim();
            if (paraText) {
              // Process bold and italic in paragraphs
              const processedText = paraText
                .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
                .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
              htmlLines.push(`<p class="mb-3 leading-relaxed text-foreground">${processedText}</p>`);
            }
            currentParagraph = [];
          }
        };
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Empty line - flush paragraph and close list if needed
          if (!line) {
            flushParagraph();
            if (inList) {
              htmlLines.push('</ul>');
              inList = false;
            }
            continue;
          }
          
          // Headers
          if (line.startsWith('### ')) {
            flushParagraph();
            if (inList) {
              htmlLines.push('</ul>');
              inList = false;
            }
            let text = line.substring(4).trim();
            text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
            htmlLines.push(`<h3 class="text-lg font-bold mt-4 mb-2 text-foreground">${text}</h3>`);
          } else if (line.startsWith('## ')) {
            flushParagraph();
            if (inList) {
              htmlLines.push('</ul>');
              inList = false;
            }
            let text = line.substring(3).trim();
            text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
            htmlLines.push(`<h2 class="text-xl font-bold mt-5 mb-3 text-foreground">${text}</h2>`);
          } else if (line.startsWith('# ')) {
            flushParagraph();
            if (inList) {
              htmlLines.push('</ul>');
              inList = false;
            }
            let text = line.substring(2).trim();
            text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
            htmlLines.push(`<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">${text}</h1>`);
          }
          // List items
          else if (/^\s*[-*+]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
            flushParagraph();
            if (!inList) {
              htmlLines.push('<ul class="list-disc space-y-1 my-2 ml-4">');
              inList = true;
            }
            // Remove list marker and process content
            const content = line.replace(/^\s*[-*+]\s+/, '').replace(/^\s*\d+\.\s+/, '').trim();
            // Process bold text in list items
            const processedContent = content
              .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
            htmlLines.push(`<li class="mb-1 text-foreground">${processedContent}</li>`);
          }
          // Regular paragraph text (accumulate until empty line or special element)
          else {
            if (inList) {
              htmlLines.push('</ul>');
              inList = false;
            }
            currentParagraph.push(line);
          }
        }
        
        // Flush any remaining paragraph
        flushParagraph();
        
        // Close any open list
        if (inList) {
          htmlLines.push('</ul>');
        }
        
        let cleanedText = htmlLines.join('\n');

        // Improved confidence score calculation
        // RAG scores are typically 0-1, but we want to show higher confidence for good answers
        let confidence = 0.8; // Default confidence
        
        if (scores.length > 0) {
          const maxScore = Math.max(...scores);
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          
          // If we have multiple high-quality sources, boost confidence
          const highQualitySources = scores.filter(s => s > 0.5).length;
          
          // Calculate confidence: combine max score, average, and source count
          // Higher scores and more sources = higher confidence
          confidence = Math.min(0.95, Math.max(0.7, 
            (maxScore * 0.6) + (avgScore * 0.3) + (Math.min(highQualitySources / 5, 0.1))
          ));
        } else if (responseAny.confidence) {
          confidence = Math.min(0.95, Math.max(0.7, responseAny.confidence));
        }
        
        // If synthesis was successful (not fallback), boost confidence significantly
        // Check if this looks like a synthesized answer (not raw extraction)
        const isSynthesized = responseText.length > 200 && 
          !responseText.includes('Table 3.') && 
          !responseText.includes('Chapter') &&
          !responseText.startsWith('Table') &&
          (responseText.includes('•') || responseText.includes('**') || responseText.includes('*'));
        
        if (isSynthesized) {
          // Synthesized answers are high quality - boost confidence
          confidence = Math.min(0.95, Math.max(confidence, 0.85));
        }

        const ragResponse: RagResponse = {
          text: cleanedText,
          sources: Array.from(sourceMap.values()), // Convert Map to array of unique sources
          confidence: confidence,
        };

        // Log successful request
        console.log('tRPC RAG request successful', {
          promptLength: prompt.length,
          sourcesCount: ragResponse.sources.length,
        });

        // Return success response
        res.status(200).json(ragResponse);
      } catch (error: any) {
        console.error('tRPC Handler - Vertex AI SDK error:', error);
        throw error;
      }
    } catch (error: unknown) {
      const errorObj = error as { message?: string; stack?: string };
      console.error('tRPC RAG Engine error:', {
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

