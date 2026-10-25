/**
 * Maps query parameter keys from camelCase to PascalCase for backend compatibility.
 * Specific keys like 'id' or 'yearRangeCVId' can have custom mappings.
 * 
 * @param params Object containing query parameters
 * @param customMappings Optional custom key mappings
 * @returns URLSearchParams with mapped keys
 */
export function mapQueryParamsToPascalCase(
  params: Record<string, unknown>,
  customMappings: Record<string, string> = {}
): URLSearchParams {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      let apiKey = customMappings[key];
      
      if (!apiKey) {
        if (key === 'id') {
          apiKey = 'Id';
        } else {
          apiKey = key.charAt(0).toUpperCase() + key.slice(1);
        }
      }
      
      searchParams.append(apiKey, String(value));
    }
  });
  
  return searchParams;
}
