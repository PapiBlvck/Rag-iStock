import { onRequest, Request } from 'firebase-functions/v2/https';
import { Response } from 'express';
import { initializeApp, getApps } from 'firebase-admin/app';
import { handleCorsPreflight, setCorsHeaders } from './cors';
import { getRagConfig } from './lib/rag-config';
import { getVertexRagClient } from './lib/rag-client';
import { synthesizeAnswer } from './lib/rag-synthesis';
import { formatContextsAsAnswer, markdownToHtml, calculateConfidence } from './lib/rag-formatter';
import { extractContextsAndScores, extractContextTexts } from './lib/rag-context-extractor';
import { extractSources } from './lib/rag-source-extractor';
import { parseRequest } from './lib/request-parser';

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
 * tRPC endpoint handler for RAG queries
 */
export const trpc = onRequest(
  {
    region: process.env.RAG_ENGINE_LOCATION || 'europe-west3',
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '512MiB',
  },
  async (req: Request, res: Response) => {
    // Handle CORS preflight
    if (handleCorsPreflight(req, res)) {
      return;
    }

    // Set CORS headers
    const allowedOrigin = setCorsHeaders(req, res);
    
    if (req.headers.origin && !allowedOrigin) {
      res.status(403).json({ error: 'Origin not allowed by CORS policy' });
      return;
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    try {
      // Parse request body
      let body: any = {};
      
      if (req.body) {
        if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
          body = req.body;
        } else if (typeof req.body === 'string') {
          try {
            body = JSON.parse(req.body);
          } catch (e) {
            res.status(400).json({ error: 'Invalid JSON in request body' });
            return;
          }
        }
      } else {
        res.status(400).json({ error: 'Request body is required' });
        return;
      }

      // Parse and validate request
      let prompt: string;
      
      try {
        const parsed = parseRequest(body);
        prompt = parsed.prompt;
        // context is parsed but not currently used in RAG query
      } catch (error: any) {
        res.status(400).json({ error: error.message });
        return;
      }

      console.log('tRPC Handler - Prompt validated, length:', prompt.length);

      // Get RAG configuration
      const { projectId, location, ragEngineId } = getRagConfig();
      
      console.log('tRPC Handler - RAG Config:', { projectId, location, ragEngineId });

      // Query RAG corpus using Vertex AI SDK
      const ragClient = getVertexRagClient(projectId, location);
      const parent = `projects/${projectId}/locations/${location}`;
      const ragCorpusName = `projects/${projectId}/locations/${location}/ragCorpora/${ragEngineId}`;

      const result = await ragClient.retrieveContexts({
        parent: parent,
        query: { text: prompt },
        vertexRagStore: {
          ragResources: [{ ragCorpus: ragCorpusName }],
        },
      });

      const [response] = await result;
      console.log('tRPC Handler - Vertex AI SDK response received');

      // Extract contexts and scores
      const { contexts: contextsArray, scores } = extractContextsAndScores(response);
      const contextTexts = extractContextTexts(contextsArray);
      
      console.log('tRPC Handler - Extracted contexts count:', contextsArray.length);
      console.log('tRPC Handler - Extracted scores count:', scores.length);
      console.log('tRPC Handler - Sample scores:', scores.slice(0, 5));
      console.log('tRPC Handler - Response structure keys:', Object.keys(response || {}));
      
      // Log first context structure for debugging
      if (contextsArray.length > 0) {
        console.log('tRPC Handler - First context keys:', Object.keys(contextsArray[0] || {}));
        console.log('tRPC Handler - First context sample:', JSON.stringify(contextsArray[0]).substring(0, 200));
      }

      // Synthesize answer using LLM
      let responseText = 'No response generated';
      
      if (contextTexts.length > 0) {
        try {
          responseText = await synthesizeAnswer(prompt, contextTexts, projectId, location);
          console.log('tRPC Handler - Synthesized answer length:', responseText.length);
        } catch (synthesisError: any) {
          console.error('tRPC Handler - Synthesis failed:', synthesisError.message);
        }
      }
      
      // Fallback if synthesis didn't work
      if (responseText === 'No response generated' || responseText.length < 50) {
        console.log('tRPC Handler - Using enhanced fallback formatting');
        responseText = formatContextsAsAnswer(prompt, contextTexts);
      }

      // Convert markdown to HTML
      const cleanedText = markdownToHtml(responseText);

      // Extract sources
      const sources = extractSources(contextsArray);

      // Calculate confidence
      const confidence = calculateConfidence(scores, responseText, response as any);
      
      console.log('tRPC Handler - Final confidence:', confidence);

      const ragResponse: RagResponse = {
        text: cleanedText,
        sources,
        confidence,
      };

      console.log('tRPC RAG request successful', {
        promptLength: prompt.length,
        sourcesCount: ragResponse.sources.length,
      });

      res.status(200).json(ragResponse);
    } catch (error: unknown) {
      const errorObj = error as { message?: string; stack?: string };
      console.error('tRPC RAG Engine error:', {
        error: errorObj.message,
        stack: errorObj.stack,
      });

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

      setCorsHeaders(req, res);
      
      res.status(statusCode).json({
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorObj.stack : undefined,
      });
    }
  }
);
