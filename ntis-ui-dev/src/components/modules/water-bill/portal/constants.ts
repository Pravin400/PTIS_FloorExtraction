import {
  Droplet,
  Leaf,
  Users,
  FileText,
  FilePlus,
  FileSearch,
  UserCog,
  Calculator,
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Megaphone,
  Calendar,
  Settings,
  CreditCard,
  Link2,
  Receipt,
} from "lucide-react";

export const FEATURE_ICONS: Record<string, typeof Droplet> = {
  droplet: Droplet,
  leaf: Leaf,
  users: Users,
};

export const SOCIAL_ICONS: Record<string, typeof Facebook> = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
  x: Twitter,
};

/** Maps PortalContent.iconName values (API) to lucide icons. */
export const CONTENT_ICONS: Record<string, typeof FileText> = {
  megaphone: Megaphone,
  "file-text": FileText,
  calendar: Calendar,
  settings: Settings,
  "credit-card": CreditCard,
  link: Link2,
};

/** Maps CitizenService.iconName values (API) to lucide icons. */
export const CITIZEN_SERVICE_ICONS: Record<string, typeof FileText> = {
  receipt: Receipt,
  "file-plus": FilePlus,
  "file-text": FileText,
  "user-edit": UserCog,
  calculator: Calculator,
  users: Users,
};

/** Cycled background/icon/title color triples applied to citizen service tiles by index — icon/title shades are a darker tone of the same hue as the card background. */
export const CITIZEN_SERVICE_TILE_STYLES = [
  { bg: "bg-blue-100/75", iconBg: "bg-blue-700", titleColor: "text-blue-700" },
  { bg: "bg-green-100/75", iconBg: "bg-green-700", titleColor: "text-green-700" },
  { bg: "bg-amber-100/75", iconBg: "bg-amber-700", titleColor: "text-amber-700" },
  { bg: "bg-purple-100/75", iconBg: "bg-purple-700", titleColor: "text-purple-700" },
  { bg: "bg-red-100/75", iconBg: "bg-red-700", titleColor: "text-red-700" },
  { bg: "bg-sky-100/75", iconBg: "bg-sky-700", titleColor: "text-sky-700" },
] as const;

export const DEFAULT_CITIZEN_SERVICE_ICON = FileSearch;
