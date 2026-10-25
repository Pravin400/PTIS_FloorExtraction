'use client';

import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { ICON_MAP } from './assetKpiConstants';
import type { AssetKpiCardProps } from '@/types/asset-gis.types';

export function AssetKpiCard({
  title,
  iconName,
  color,
  displayValue,
  isActive,
  onCardClick,
  index,
}: AssetKpiCardProps) {
  const IconComponent: LucideIcon = ICON_MAP[iconName] || ICON_MAP['fa-cubes'];

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onCardClick}
      className={`group relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer overflow-hidden ${
        isActive
          ? 'bg-gradient-to-br from-blue-50/90 to-indigo-50/70 border-blue-400/80 shadow-md shadow-blue-500/10 ring-2 ring-blue-400/30'
          : 'bg-white hover:bg-slate-50/80 border-slate-200/80 hover:border-slate-300 shadow-sm'
      }`}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105"
        style={{
          backgroundColor: `${color}15`,
          color: color,
        }}
      >
        <IconComponent className="w-5 h-5" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium text-slate-500 truncate leading-tight mb-0.5">
          {title}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-base font-bold text-slate-800 tracking-tight leading-none">
            {displayValue.num}
          </span>
          {displayValue.sub && (
            <span className="text-[10px] font-semibold text-slate-500 uppercase">
              {displayValue.sub}
            </span>
          )}
        </div>
      </div>

      <div
        className="absolute top-0 left-0 w-1 h-full rounded-l-xl transition-opacity duration-200"
        style={{
          backgroundColor: color,
          opacity: isActive ? 1 : 0,
        }}
      />
    </motion.button>
  );
}
