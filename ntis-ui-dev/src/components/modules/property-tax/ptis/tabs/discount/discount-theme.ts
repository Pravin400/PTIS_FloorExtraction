'use client';

import React from 'react';
import {
  Percent,
  Users,
  Sun,
  Zap,
  Droplets,
  Leaf,
  ShieldCheck,
  Building2,
  HeartHandshake,
  Award,
} from 'lucide-react';

export interface DiscountTheme {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  accentBar: string;
}

export function getDiscountTheme(
  attributeName?: string | null,
  attributeCode?: string | null,
  isDiscount = true
): DiscountTheme {
  const text = `${attributeName || ''} ${attributeCode || ''}`.toLowerCase();

  if (text.includes('solar') || text.includes('sun') || text.includes('photovoltaic')) {
    return {
      icon: Sun,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
      accentBar: 'before:bg-amber-500',
    };
  }

  if (text.includes('ev') || text.includes('charging') || text.includes('electric') || text.includes('battery')) {
    return {
      icon: Zap,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
      accentBar: 'before:bg-emerald-500',
    };
  }

  if (
    text.includes('sewage') ||
    text.includes('stp') ||
    text.includes('water') ||
    text.includes('borewell') ||
    text.includes('rain')
  ) {
    return {
      icon: Droplets,
      iconBg: 'bg-sky-50 text-sky-600 border border-sky-200/60',
      accentBar: 'before:bg-sky-500',
    };
  }

  if (text.includes('green') || text.includes('waste') || text.includes('tree') || text.includes('compost')) {
    return {
      icon: Leaf,
      iconBg: 'bg-teal-50 text-teal-600 border border-teal-200/60',
      accentBar: 'before:bg-teal-500',
    };
  }

  if (text.includes('fire') || text.includes('safety') || text.includes('security')) {
    return {
      icon: ShieldCheck,
      iconBg: 'bg-red-50 text-red-600 border border-red-200/60',
      accentBar: 'before:bg-red-500',
    };
  }

  if (text.includes('club') || text.includes('gym') || text.includes('pool') || text.includes('amenit')) {
    return {
      icon: Building2,
      iconBg: 'bg-indigo-50 text-indigo-600 border border-indigo-200/60',
      accentBar: 'before:bg-indigo-500',
    };
  }

  if (
    text.includes('senior') ||
    text.includes('concession') ||
    text.includes('women') ||
    text.includes('handicap') ||
    text.includes('disab')
  ) {
    return {
      icon: HeartHandshake,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200/60',
      accentBar: 'before:bg-rose-500',
    };
  }

  if (text.includes('freedom') || text.includes('defence') || text.includes('award')) {
    return {
      icon: Award,
      iconBg: 'bg-orange-50 text-orange-600 border border-orange-200/60',
      accentBar: 'before:bg-orange-500',
    };
  }

  if (isDiscount) {
    return {
      icon: Percent,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
      accentBar: 'before:bg-blue-600',
    };
  }

  return {
    icon: Users,
    iconBg: 'bg-purple-50 text-purple-600 border border-purple-200/60',
    accentBar: 'before:bg-purple-600',
  };
}
