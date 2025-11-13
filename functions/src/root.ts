import { onRequest, Request } from 'firebase-functions/v2/https';
import { Response } from 'express';
import { setCorsHeaders, ALLOWED_ORIGINS } from './cors';

/**
 * Root endpoint handler
 * Handles requests to the root path (/) with proper CORS configuration
 * 
 * This endpoint can be used for health checks or as a main entry point
 */
export const root = onRequest(
  {
    region: process.env.RAG_ENGINE_LOCATION || 'europe-west3', // Updated to europe-west3 for new RAG engine
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '256MiB',
  },
  async (req: Request, res: Response) => {
    // ========================================
    // CRITICAL: OPTIONS handling MUST be FIRST
    // ========================================
    // The browser sends OPTIONS preflight BEFORE the actual request
    // This MUST be handled immediately, before ANY other logic
    if (req.method === 'OPTIONS') {
      const origin = req.headers.origin as string | undefined;
      
      // Check if origin is in allowed list
      if (origin && ALLOWED_ORIGINS.includes(origin)) {
        // Set all required CORS headers for preflight
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Access-Control-Allow-Credentials', 'true');
        res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, trpc-accept-type, trpc-content-type');
        res.set('Access-Control-Max-Age', '3600');
      } else {
        // Still respond to preflight (browser will check headers)
        res.set('Access-Control-Allow-Origin', origin || '*');
        res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, trpc-accept-type, trpc-content-type');
        res.set('Access-Control-Max-Age', '3600');
      }
      
      // CRITICAL: Send 204 immediately and STOP - do not continue
      res.status(204).send('');
      return;
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
    
    // Handle GET requests for health check
    if (req.method === 'GET') {
      res.status(200).json({
        message: 'iStock RAG Query API',
        status: 'online',
        endpoints: {
          root: '/',
          ragQuery: '/ragQuery',
        },
        version: '1.0.0',
      });
      return;
    }
    
    // Handle POST requests (if needed for root)
    if (req.method === 'POST') {
      res.status(200).json({
        message: 'iStock RAG Query API',
        status: 'online',
        hint: 'Use /ragQuery endpoint for RAG queries',
      });
      return;
    }
    
    // Method not allowed
    res.status(405).json({
      error: 'Method not allowed',
      allowedMethods: ['GET', 'POST', 'OPTIONS'],
    });
  }
);

