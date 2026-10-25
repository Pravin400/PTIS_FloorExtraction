import { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Briefcase,
  CreditCard,
  LockKeyhole,
  MessageSquare,
  Server,
  Settings,
  Shield,
  Smartphone,
  UserCheck,
} from 'lucide-react';

/**
 * Category color palette definitions.
 * Extracted to keep ui.types.ts within the 200-line SRP limit.
 */
export const CATEGORY_COLORS: Record<
  string,
  {
    activeBorder: string;
    bg: string;
    iconColor: string;
    iconBg: string;
    progressBar: string;
    badge: string;
    lightBg: string;
    hoverBorder: string;
  }
> = {
  rose: {
    activeBorder: 'border-rose-500',
    bg: 'bg-rose-50',
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-100',
    progressBar: 'bg-rose-500',
    badge: 'bg-rose-500',
    lightBg: 'bg-red-50/30',
    hoverBorder: 'hover:border-rose-200',
  },
  emerald: {
    activeBorder: 'border-emerald-500',
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    progressBar: 'bg-emerald-500',
    badge: 'bg-emerald-500',
    lightBg: 'bg-emerald-50/30',
    hoverBorder: 'hover:border-emerald-200',
  },
  blue: {
    activeBorder: 'border-blue-500',
    bg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    progressBar: 'bg-blue-500',
    badge: 'bg-blue-500',
    lightBg: 'bg-blue-50/30',
    hoverBorder: 'hover:border-blue-200',
  },
  purple: {
    activeBorder: 'border-purple-500',
    bg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    progressBar: 'bg-purple-500',
    badge: 'bg-purple-500',
    lightBg: 'bg-purple-50/30',
    hoverBorder: 'hover:border-purple-200',
  },
  violet: {
    activeBorder: 'border-violet-500',
    bg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-100',
    progressBar: 'bg-violet-500',
    badge: 'bg-violet-500',
    lightBg: 'bg-violet-50/30',
    hoverBorder: 'hover:border-violet-200',
  },
  cyan: {
    activeBorder: 'border-cyan-500',
    bg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    iconBg: 'bg-cyan-100',
    progressBar: 'bg-cyan-500',
    badge: 'bg-cyan-500',
    lightBg: 'bg-cyan-50/30',
    hoverBorder: 'hover:border-cyan-200',
  },
};

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  security: Shield,
  payment: CreditCard,
  communication: MessageSquare,
  workflow: Briefcase,
  citizen: UserCheck,
  mobile: Smartphone,
  integration: Server,
  reporting: BarChart3,
  audit: LockKeyhole,
  system: Settings,
};
