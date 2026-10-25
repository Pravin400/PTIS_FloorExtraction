import type { PortalConfigJson } from "@/types/water-bill/portalConfig.types";

export type PortalLanguage = "en" | "mr";

export type TranslateFn = (en: string, local: string) => string;

export interface PortalSectionProps {
  config: PortalConfigJson;
  lang: PortalLanguage;
  t: TranslateFn;
}

export interface PortalUpdateItem {
  tag: string;
  text: string;
}

export interface PortalAnnouncementItem {
  date: string;
  month: string;
  isNew: boolean;
  title: string;
  desc: string;
}
