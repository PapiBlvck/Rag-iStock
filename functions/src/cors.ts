import { Response } from 'express';

/**
 * Allowed origins for CORS
 * Add your production frontend URL here when ready
 */
export const ALLOWED_ORIGINS = [
  'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://localhost:5176',
  // TODO: Add your production frontend URL here
  // 'https://my-app-domain.com',
  // 'https://www.my-app-domain.com',
];

/**
 * Set CORS headers on response
 * @param req - Express request object
 * @param res - Express response object
 * @returns The allowed origin or null if not allowed
 */
export function setCorsHeaders(req: any, res: Response): string | null {
  const origin = req.headers.origin as string | undefined;
  
  // Check if origin is in allowed list
  let allowedOrigin: string | null = null;
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    allowedOrigin = origin;
  } else if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
    // For development, allow localhost origins even if not in list
    allowedOrigin = origin;
  } else if (!origin) {
    // No origin header (e.g., same-origin request, Postman, etc.)
    // Allow it but don't set credentials
    allowedOrigin = '*';
  }
  
  if (allowedOrigin) {
    res.set('Access-Control-Allow-Origin', allowedOrigin);
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, trpc-accept-type, trpc-content-type');
    
    // Only set credentials if we have a specific origin (not *)
    if (allowedOrigin !== '*') {
      res.set('Access-Control-Allow-Credentials', 'true');
    }
    
    res.set('Access-Control-Max-Age', '3600');
  }
  
  return allowedOrigin;
}

/**
 * Handle CORS preflight OPTIONS request
 * This function MUST be called FIRST in any handler
 * @param req - Express request object
 * @param res - Express response object
 * @returns true if preflight was handled, false otherwise
 */
export function handleCorsPreflight(req: any, res: Response): boolean {
  // CRITICAL: Check OPTIONS method FIRST before anything else
  if (req.method === 'OPTIONS') {
    const origin = req.headers.origin as string | undefined;
    
    console.log('CORS Preflight - Origin:', origin);
    console.log('CORS Preflight - Allowed origins:', ALLOWED_ORIGINS);
    
    // Check if origin is in allowed list
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      // Set all required CORS headers for preflight
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Access-Control-Allow-Credentials', 'true');
      res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, trpc-accept-type, trpc-content-type');
      res.set('Access-Control-Max-Age', '3600');
      console.log('CORS Preflight - Allowed origin:', origin);
    } else if (origin) {
      // Origin specified but not allowed - still respond to preflight
      // Browser will check Access-Control-Allow-Origin header
      console.warn('CORS Preflight - Origin not in allowed list:', origin);
      // For development, allow localhost origins even if not in list
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Access-Control-Allow-Credentials', 'true');
        res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, trpc-accept-type, trpc-content-type');
        res.set('Access-Control-Max-Age', '3600');
        console.log('CORS Preflight - Allowed localhost origin:', origin);
      } else {
        res.set('Access-Control-Allow-Origin', '');
        res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, trpc-accept-type, trpc-content-type');
      }
    } else {
      // No origin header - allow with wildcard (no credentials)
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, trpc-accept-type, trpc-content-type');
      console.log('CORS Preflight - No origin header, using wildcard');
    }
    
    // CRITICAL: Send 204 immediately and stop all further execution
    res.status(204).send('');
    return true;
  }
  
  return false;
}

/**
 * CORS middleware wrapper - handles preflight and sets headers
 * Use this in your Firebase Function handlers
 */
export function withCors(handler: (req: any, res: Response) => Promise<void> | void) {
  return async (req: any, res: Response) => {
    // Handle preflight OPTIONS request
    if (handleCorsPreflight(req, res)) {
      return;
    }
    
    // Set CORS headers for actual request
    const allowedOrigin = setCorsHeaders(req, res);
    
    // For actual requests, if origin is specified and not allowed, reject
    if (req.headers.origin && !allowedOrigin) {
      res.status(403).json({ error: 'Origin not allowed by CORS policy' });
      return;
    }
    
    // Call the actual handler
    await handler(req, res);
  };
}

