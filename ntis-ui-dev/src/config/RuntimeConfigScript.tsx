/**
 * Runtime Config Script Component
 * 
 * This server component injects runtime configuration into the HTML
 * as a script tag, making it available to client components via window.__RUNTIME_CONFIG__
 */

import { getServerRuntimeConfig, validateRuntimeConfig } from './runtime-config';

export function RuntimeConfigScript() {
  const config = getServerRuntimeConfig();
  
  // Validate config on server side
  validateRuntimeConfig(config);
  
  return (
    <>
      <script
        id="runtime-config-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(config) }}
        suppressHydrationWarning
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var el=document.getElementById("runtime-config-data");if(el&&el.textContent){window.__RUNTIME_CONFIG__=JSON.parse(el.textContent);}}catch(e){}`,
        }}
        suppressHydrationWarning
      />
    </>
  );
}
