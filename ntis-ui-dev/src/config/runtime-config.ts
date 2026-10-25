/**
 * Runtime Configuration
 *
 * This module provides runtime configuration that is injected by the server
 * into the HTML and read by the client. This allows the same build artifact
 * to be deployed to different environments with different configurations.
 *
 * Server-side: reads from process.env
 * Client-side: reads from window.__RUNTIME_CONFIG__
 */

// Extend Window interface to include runtime config
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig;
  }
}

/**
 * Runtime configuration interface
 * These values are read from environment variables at runtime (not build time)
 */
export interface RuntimeConfig {
  apiBaseUrl: string;
  appEnv: string;
  authEnabled: boolean;
  featureAnalytics: boolean;
  featureDebug: boolean;
  councilName?: string;
}

/**
 * Default configuration values
 */
const defaultConfig: RuntimeConfig = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  appEnv: 'development',
  authEnabled: false,
  featureAnalytics: false,
  featureDebug: false,
  councilName: process.env.NEXT_PUBLIC_COUNCIL_NAME || process.env.COUNCIL_NAME || 'JALNA_survey',
};

/**
 * Check if we're running on the server
 */
const isServer = typeof window === 'undefined';

/**
 * Get runtime configuration from environment variables (server-side only)
 * This should be called in server components to get fresh config
 */
export function getServerRuntimeConfig(): RuntimeConfig {
  return {
    apiBaseUrl: process.env.RUNTIME_API_BASE_URL || defaultConfig.apiBaseUrl,
    appEnv: process.env.RUNTIME_APP_ENV || defaultConfig.appEnv,
    authEnabled: process.env.RUNTIME_AUTH_ENABLED === 'true',
    featureAnalytics: process.env.RUNTIME_FEATURE_ANALYTICS === 'true',
    featureDebug: process.env.RUNTIME_FEATURE_DEBUG === 'true',
    councilName:
      process.env.RUNTIME_COUNCIL_NAME ||
      process.env.NEXT_PUBLIC_COUNCIL_NAME ||
      process.env.COUNCIL_NAME ||
      defaultConfig.councilName,
  };
}

/**
 * Get runtime configuration (works on both server and client)
 * - Server: reads from process.env
 * - Client: reads from window.__RUNTIME_CONFIG__ (injected by server)
 */
export function getRuntimeConfig(): RuntimeConfig {
  if (isServer) {
    return getServerRuntimeConfig();
  }

  // Client-side: read from window object if already cached
  if (window.__RUNTIME_CONFIG__) {
    return window.__RUNTIME_CONFIG__;
  }

  // Fallback: parse from #runtime-config-data JSON block injected by server
  if (typeof document !== 'undefined') {
    const el = document.getElementById('runtime-config-data');
    if (el && el.textContent) {
      try {
        const parsed = JSON.parse(el.textContent) as RuntimeConfig;
        window.__RUNTIME_CONFIG__ = parsed;
        return parsed;
      } catch {
        // Fall back to default config if parse fails
      }
    }
  }

  return defaultConfig;
}

/**
 * Validate runtime configuration and log warnings for missing values
 */
export function validateRuntimeConfig(config: RuntimeConfig): void {
  const warnings: string[] = [];

  if (!config.apiBaseUrl || config.apiBaseUrl === defaultConfig.apiBaseUrl) {
    warnings.push('RUNTIME_API_BASE_URL is not set, using default');
  }

  if (!config.appEnv || config.appEnv === defaultConfig.appEnv) {
    warnings.push('RUNTIME_APP_ENV is not set, using default');
  }

  if (warnings.length > 0 && config.appEnv !== 'development') {
    console.warn('⚠️  Runtime Configuration Warnings:');
    warnings.forEach((w) => console.warn(`   - ${w}`));
  }
}