 
import { logger } from "@/lib/utils/logger";

/**
 * Service to transliterate text using Google Input Tools API.
 * Encapsulates the external API call away from server action layer.
 */
class TransliterationService {
  private async transliterateSingleToken(token: string, itc: string): Promise<string[]> {
    try {
      const res = await fetch(
        `https://inputtools.google.com/request?text=${encodeURIComponent(token)}&itc=${itc}&num=5`
      );
      const data = await res.json();
      const candidates = data?.[1]?.[0]?.[1];
      if (Array.isArray(candidates)) {
        return candidates.filter((c): c is string => typeof c === "string" && /[\u0900-\u097F]/.test(c));
      }
      return [];
    } catch {
      return [];
    }
  }

  async transliterateText(text: string, locale: string): Promise<string | null> {
    if (!text || !text.trim()) return null;
    const primaryItc = locale === "hi" ? "hi-t-i0-und" : "mr-t-i0-und";
    const fallbackItc = locale === "hi" ? "mr-t-i0-und" : "hi-t-i0-und";

    try {
      const tokens = text.split(/([a-zA-Z]+)/);
      const transliteratedTokens = await Promise.all(
        tokens.map(async (token) => {
          if (!/[a-zA-Z]/.test(token)) return token;

          const lower = token.toLowerCase();
          if (lower === "naka") return "नाका";

          const [primaryCandidates, fallbackCandidates] = await Promise.all([
            this.transliterateSingleToken(token, primaryItc),
            this.transliterateSingleToken(token, fallbackItc),
          ]);

          if (lower === "near" && fallbackCandidates.length > 0) {
            return fallbackCandidates[0];
          }

          if (primaryCandidates.length > 0) {
            return primaryCandidates[0];
          }
          if (fallbackCandidates.length > 0) {
            return fallbackCandidates[0];
          }
          return token;
        })
      );
      const result = transliteratedTokens.join("");
      return result || null;
    } catch (error) {
      logger.error("Transliteration service execution error", { error: error instanceof Error ? error : undefined });
      return null;
    }
  }
}

export const transliterationService = new TransliterationService();
