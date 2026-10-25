"use server";

import { transliterationService } from "@/lib/api/asset/municipal-Asset/new-add-new-asset/transliteration.service";

/**
 * Server action to transliterate text using transliterationService.
 */
export async function transliterateTextAction(text: string, locale: string): Promise<string | null> {
  return await transliterationService.transliterateText(text, locale);
}
