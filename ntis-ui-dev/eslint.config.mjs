import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import i18next from "eslint-plugin-i18next";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      i18next,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ],
      "i18next/no-literal-string": [
        "error",
        {
          mode: "jsx-text-only",
          ignoreAttribute: [
            "className",
            "class",
            "style",
            "type",
            "id",
            "data-testid",
            "data-test",
            "role",
            "aria-label",
            "aria-labelledby",
            "aria-describedby",
            "aria-selected",
            "aria-controls",
            "aria-expanded",
            "aria-haspopup",
            "aria-invalid",
            "name",
            "method",
            "target",
            "rel",
            "href",
            "src",
            "alt",
            "fill",
            "stroke",
            "d",
            "viewBox",
            "xmlns",
            "width",
            "height",
            "key",
            "variant",
            "size",
            "as",
            "locale",
            "displayName",
            "padding",
            "namespace",
            "value",
            "cache",
            "localePrefix",
            "title",
          ],
          ignoreCallee: [
            "getTranslations",
            "useTranslations",
            "console.error",
            "console.log",
            "console.warn",
            "revalidatePath",
          ],
          ignore: [
            "^[0-9]+$",                    // Numbers only
            "^[A-Z_]+$",                   // Constants like API_URL
            "^/.*",                        // URLs/paths starting with /
            "https?://.*",                 // HTTP(S) URLs
            "use client",                  // React directives
            "use server",
            "^[a-z]+$",                    // Single lowercase words
            ".displayName",                // Component displayName
            "^(sm|md|lg|xl|xs)$",          // Size variants
            "^(primary|secondary|ghost|danger|success|elevated|bordered|default|none)$",  // Variants
            "^(Active|Delayed|Completed|Inactive)$",   // Status values
            "^(checked|unchecked)$",       // Toggle states
            "^(en|hi|mr)$",                // Locale codes
            "^(English|हिंदी|मराठी)$",      // Language names
            "^(numeric|long|short|2-digit|currency)$",  // Format options
            "^(year|month|day|hour|minute|style)$",     // Format keys
            "^(no-store|force-cache)$",    // Cache directives
            "Content-Type",                // HTTP headers (without anchors)
            "application/json",            // MIME types (without anchors)
            "^(latin|devanagari)$",        // Font subsets
            "^--font-.*",                  // CSS variables
            "^(required|invalid)$",        // ARIA states (single words)
            "value",                       // Property names (without quotes)
            "dots",                        // Pagination
            "^variable$",                  // CSS variable key
            "^always$",                    // Middleware configs
            "^(route|status|vehicles|lastUpdate|actions)$",  // Table column keys
            "^key$",                       // React key prop
            ".*error.*",                   // Error messages (consider if these should be translated)
            ".*message.*",                 // Generic messages
            "^(dashboard|common|modules)$", // Translation namespaces
            "^(title|subtitle|form|table|buttons|errors|actions|stats)$", // Translation keys
          ],
        },
      ],
    },
  },
  // Disable i18next for test files
  {
    files: ["**/__tests__/**", "**/*.test.tsx", "**/*.test.ts", "**/*.spec.tsx", "**/*.spec.ts"],
    rules: {
      "i18next/no-literal-string": "off",
    },
  },
  // Disable i18next for config files
  {
    files: ["**/*.config.{js,ts,mjs,cjs}", "**/*.setup.{js,ts}"],
    rules: {
      "i18next/no-literal-string": "off",
    },
  },
  // Disable i18next for infrastructure files (i18n config, middleware, utils)
  {
    files: [
      "**/i18n/**/*.{js,ts}",
      "**/middleware.{js,ts}",
      "**/lib/utils/**/*.{js,ts}",
      "**/lib/constants/**/*.{js,ts}",
      "**/types/**/*.{ts,d.ts}",
      "**/services/**/*.{js,ts}",
      "**/app/**/actions.{js,ts}",
      "**/components/modules/property-tax/report-designer/**/*.{js,ts,tsx}",
      "**/components/modules/property-tax/reports/**/*.{js,ts,tsx}",
    ],
    rules: {
      "i18next/no-literal-string": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
]);

export default eslintConfig;
