/**
 * Application Configuration
 * Central configuration file for the application
 * 
 * Runtime values (API URL, environment, feature flags) are injected at runtime
 * via RuntimeConfigScript, allowing the same build to be deployed to different environments.
 * 
 * Build-time values (version) are embedded during build via NEXT_PUBLIC_ variables.
 */

import { getRuntimeConfig } from './runtime-config';

// Build-time version (embedded during build, not runtime)
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';

/**
 * Get the current application configuration
 * This function reads runtime config on each call, ensuring fresh values
 */
export function getAppConfig() {
  const runtimeConfig = getRuntimeConfig();
  
  return {
    app: {
      name: 'NTIS UI',
      description: 'NTIS Platform UI',
      version: APP_VERSION,
      env: runtimeConfig.appEnv,
    },
    api: {
      baseUrl: runtimeConfig.apiBaseUrl,
      timeout: 120000,
    },
    auth: {
      enabled: runtimeConfig.authEnabled,
      tokenKey: 'auth_token',
      refreshTokenKey: 'refresh_token',
    },
    features: {
      analytics: runtimeConfig.featureAnalytics,
      debug: runtimeConfig.featureDebug,
    },
    planApp: {
      councilName: runtimeConfig.councilName || 'JALNA_survey',
    },
  } as const;
}

/**
 * Static app config for use in server components and metadata
 * Uses default/server values at module load time
 */
export const appConfig = getAppConfig();

export type AppConfig = ReturnType<typeof getAppConfig>;