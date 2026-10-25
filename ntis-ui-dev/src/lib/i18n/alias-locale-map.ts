/**
 * Maps an active next-intl locale to the Alias Master column that supplies its
 * runtime label override. Marathi ("mr") is treated as the "regional" language.
 */
export const ALIAS_LOCALE_COLUMN = {
  en: "englishName",
  hi: "hindiName",
  mr: "regionalName",
} as const;

export type AliasLocale = keyof typeof ALIAS_LOCALE_COLUMN;

export function isAliasLocale(locale: string): locale is AliasLocale {
  return locale in ALIAS_LOCALE_COLUMN;
}
