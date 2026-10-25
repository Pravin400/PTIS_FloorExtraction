import enMessages from "@/i18n/locales/en/portal.json";
import mrMessages from "@/i18n/locales/mr/portal.json";

export const PORTAL_EN = enMessages.portal;
export const PORTAL_MR = mrMessages.portal;

/** Replaces `{placeholder}` tokens in a locale string, e.g. format("Go to slide {n}", { n: 2 }). */
export function formatTranslation(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  );
}
