/**
 * Environment variables configuration
 * 
 * All environment variables must be prefixed with VITE_ to be exposed to the client
 * Access via import.meta.env.VITE_*
 */

interface Env {
  // Firebase Config
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
  
  // Firebase Emulator (optional)
  useEmulator: boolean;
  emulatorHost: string;
  emulatorPorts: {
    auth: number;
    firestore: number;
  };
  
  // API
  trpcEndpoint: string;
  
  // Environment
  environment: 'development' | 'staging' | 'production';
  
  // Optional
  enableAnalytics: boolean;
  sentryDsn?: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key];
  // Only warn if the variable is required (no defaultValue) and not set
  if (!value && !defaultValue) {
    // Skip warnings for optional variables
    const optionalVars = [
      'VITE_FIREBASE_MEASUREMENT_ID',
      'VITE_SENTRY_DSN',
    ];
    if (!optionalVars.includes(key)) {
      console.warn(`Environment variable ${key} is not set`);
    }
  }
  return value || defaultValue || '';
}

function getEnvVarAsBoolean(key: string, defaultValue = false): boolean {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  return value === 'true' || value === '1';
}

function getEnvVarAsNumber(key: string, defaultValue: number): number {
  const value = import.meta.env[key];
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Validated environment configuration
 */
export const env: Env = {
  firebase: {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: getEnvVar('VITE_FIREBASE_APP_ID'),
    measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID'), // Optional - only needed for Analytics
  },
  
  useEmulator: getEnvVarAsBoolean('VITE_USE_FIREBASE_EMULATOR', false),
  emulatorHost: getEnvVar('VITE_FIREBASE_EMULATOR_HOST', 'localhost'),
  emulatorPorts: {
    auth: getEnvVarAsNumber('VITE_FIREBASE_AUTH_EMULATOR_PORT', 9099),
    firestore: getEnvVarAsNumber('VITE_FIREBASE_FIRESTORE_EMULATOR_PORT', 8080),
  },
  
  trpcEndpoint: getEnvVar('VITE_TRPC_ENDPOINT', 'http://localhost:5001/trpc'),
  
  environment: (getEnvVar('VITE_ENVIRONMENT', 'development') || 'development') as Env['environment'],
  
  enableAnalytics: getEnvVarAsBoolean('VITE_ENABLE_ANALYTICS', false),
  sentryDsn: getEnvVar('VITE_SENTRY_DSN'), // Optional - only needed for Sentry error tracking
};

/**
 * Validate that required environment variables are set
 */
export function validateEnv(): void {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
  ];

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing);
    console.error('Please check your .env file and ensure all required variables are set.');
    console.error('See .env.example for reference.');
  }
}

/**
 * Check if running in development
 */
export const isDevelopment = env.environment === 'development';

/**
 * Check if running in production
 */
export const isProduction = env.environment === 'production';

