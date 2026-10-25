'use client';
import React, { useRef, useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import type { SummaryCardsProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
import { type LucideIcon, Box, Armchair, Monitor, FileText, Settings, Car, Shield, Fence, DoorOpen, Droplets, Lightbulb, ChevronLeft, ChevronRight } from "lucide-react";


const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  'LAND-FF': Armchair,
  'LAND-IT': Monitor,
  'LAND-STAT': FileText,
  'LAND-TOOL': Settings,
  'LAND-VEH': Car,
  'LAND-SEC': Shield,
  'LAND-FEN': Fence,
  'LAND-GATE': DoorOpen,
  'LAND-BOR': Droplets,
  'LAND-LIGHT': Lightbulb,
  'furniture': Armchair,
  'electronics': Monitor,
  'stationery': FileText,
  'tools': Settings,
  'vehicle': Car,
  'boundary': Shield,
  'fencing': Fence,
  'gate': DoorOpen,
  'borewell': Droplets,
  'lighting': Lightbulb,
};

function getCategoryIcon(typeCode: string, typeName: string): LucideIcon {
  const codeKey = String(typeCode || '').toUpperCase();
  const nameKey = String(typeName || '').toLowerCase();
  return CATEGORY_ICON_MAP[codeKey] || CATEGORY_ICON_MAP[nameKey] || Box;
}

const CATEGORY_COLOR_MAP: Record<string, { bg: string; iconBg: string; text: string; icon: string }> = {
  'furniture': { bg: 'bg-red-50/50', iconBg: 'bg-red-100/50', text: 'text-red-600', icon: 'text-red-500' },
  'electronics': { bg: 'bg-indigo-50/50', iconBg: 'bg-indigo-100/50', text: 'text-[#1c2aab]', icon: 'text-indigo-600' },
  'stationery': { bg: 'bg-teal-50/50', iconBg: 'bg-teal-100/50', text: 'text-teal-700', icon: 'text-teal-600' },
  'tools': { bg: 'bg-orange-50/50', iconBg: 'bg-orange-100/50', text: 'text-orange-600', icon: 'text-orange-500' },
  'vehicle': { bg: 'bg-amber-50/50', iconBg: 'bg-amber-100/50', text: 'text-amber-700', icon: 'text-amber-600' },
  'boundary': { bg: 'bg-emerald-50/50', iconBg: 'bg-emerald-100/50', text: 'text-emerald-700', icon: 'text-emerald-600' },
  'fencing': { bg: 'bg-cyan-50/50', iconBg: 'bg-cyan-100/50', text: 'text-cyan-700', icon: 'text-cyan-600' },
  'gate': { bg: 'bg-violet-50/50', iconBg: 'bg-violet-100/50', text: 'text-violet-700', icon: 'text-violet-600' },
  'borewell': { bg: 'bg-sky-50/50', iconBg: 'bg-sky-100/50', text: 'text-sky-700', icon: 'text-sky-600' },
  'lighting': { bg: 'bg-yellow-50/40', iconBg: 'bg-yellow-100/50', text: 'text-yellow-700', icon: 'text-yellow-600' },
};

function getCategoryColors(typeName: string) {
  const key = String(typeName || '').toLowerCase();
  for (const k of Object.keys(CATEGORY_COLOR_MAP)) {
    if (key.includes(k)) return CATEGORY_COLOR_MAP[k];
  }
  return { bg: 'bg-blue-50/50', iconBg: 'bg-blue-100/50', text: 'text-blue-700', icon: 'text-blue-600' };
}

export function SummaryCards({ data = [], categories = [] }: SummaryCardsProps) {
  const t = useTranslations("newAddNewAsset");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setShowLeftArrow(scrollLeft > 5);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 5);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const timer = setTimeout(checkScrollState, 150);
      el.addEventListener('scroll', checkScrollState);
      window.addEventListener('resize', checkScrollState);
      return () => {
        clearTimeout(timer);
        el.removeEventListener('scroll', checkScrollState);
        window.removeEventListener('resize', checkScrollState);
      };
    }
  }, [categories, data, checkScrollState]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 240;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScrollState, 350);
    }
  };

  const totalQty = data.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  // Generate dynamic category cards
  const cards = React.useMemo(() => {
    const list = [
      {
        title: 'Total Assets',
        value: String(totalQty),
        icon: Box,
        bgClass: 'bg-blue-50/50 border-blue-100/50',
        iconBg: 'bg-blue-100/50',
        iconColor: 'text-blue-600',
        textColor: 'text-blue-800'
      }
    ];

    if (categories.length > 0) {
      categories.forEach(cat => {
        const cleanName = cat.typeName.replace(/^[A-Z]\)\s*/i, "");
        const normalizedCatType = cleanName.toLowerCase().replace(/\s+/g, "-");
        const typeRows = data.filter(r => String(r.category).toLowerCase().replace(/\s+/g, "-") === normalizedCatType || String(r.category).toLowerCase() === cleanName.toLowerCase());
        const catQty = typeRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
        const icon = getCategoryIcon(cat.typeCode, cat.typeName);
        const colors = getCategoryColors(cat.typeName);

        list.push({
          title: cleanName,
          value: String(catQty),
          icon,
          bgClass: `${colors.bg} border-slate-100/50`,
          iconBg: colors.iconBg,
          iconColor: colors.icon,
          textColor: colors.text
        });
      });
    } else {
      // Fallback keys if categories are empty
      const fallbacks = ['furniture', 'electronics', 'stationery', 'tools'] as const;
      fallbacks.forEach(type => {
        const typeRows = data.filter(r => String(r.category).toLowerCase().includes(type));
        const qty = typeRows.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
        const icon = getCategoryIcon('', type);
        const colors = getCategoryColors(type);

        list.push({
          title: type.charAt(0).toUpperCase() + type.slice(1),
          value: String(qty),
          icon,
          bgClass: `${colors.bg} border-slate-100/50`,
          iconBg: colors.iconBg,
          iconColor: colors.icon,
          textColor: colors.text
        });
      });
    }

    return list;
  }, [data, categories, totalQty]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-full flex flex-col relative group">
      <h3 className="text-[14px] font-bold text-[#1c2aab] mb-4">{t("summary") || "Summary"}</h3>
      
      <div className="relative flex-1 flex items-center min-h-[96px]">
        {/* Left Arrow Button */}
        {showLeftArrow && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 z-10 p-1.5 rounded-full border border-slate-200 bg-white text-blue-600 shadow-md hover:bg-blue-50 transition-all focus:outline-none"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          className="flex flex-row flex-nowrap gap-3 overflow-x-auto scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full px-1"
        >
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className={`${card.bgClass} rounded-xl border p-3 flex flex-col items-center justify-center text-center w-[130px] shrink-0 transition-transform duration-200 hover:scale-[1.02]`}
              >
                <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} strokeWidth={2} />
                </div>
                <span className={`text-[11px] font-bold truncate w-full ${card.textColor || 'text-[#1c2aab]'}`} title={card.title}>
                  {card.title}
                </span>
                <span className="text-[26px] font-black text-[#1c2aab] leading-none mt-1">{card.value}</span>
              </div>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        {showRightArrow && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 z-10 p-1.5 rounded-full border border-slate-200 bg-white text-blue-600 shadow-md hover:bg-blue-50 transition-all focus:outline-none"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
