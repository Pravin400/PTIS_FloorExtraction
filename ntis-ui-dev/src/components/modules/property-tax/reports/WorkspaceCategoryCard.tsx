'use client';
import type { Category } from '@/types/report.types';
import Image from 'next/image';
import { Button } from '@/components/common';

interface CategoryCardProps {
  category: Category;
  label: string;
  count: number;
  reportsCountTemplate: string;
  isSelected: boolean;
  onClick: () => void;
}

export function CategoryCard({ category, label, count, reportsCountTemplate, isSelected, onClick }: CategoryCardProps) {
  const Icon = category.icon;
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={`relative rounded-lg border p-2.5 text-center cursor-pointer transition-all duration-300 flex flex-col items-center w-full h-auto focus:outline-none [&>span]:flex [&>span]:w-full [&>span]:flex-col [&>span]:items-center [&>span]:gap-1.5
        ${category.bgColor}
        ${isSelected
          ? `${category.borderColor} border-2 ${category.glowClass} shadow-md scale-[1.04] -translate-y-0.5`
          : `border-gray-200 hover:-translate-y-0.5 hover:shadow-sm hover:${category.borderColor}`
        }`}
    >
      {/* Selected dot indicator */}
      {isSelected && (
        <span className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full border ${category.borderColor} bg-white`} />
      )}

      {/* Icon wrapper */}
      <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 ${category.iconBg}`}>
        {category.logoBase64 && category.logoContentType ? (
          <Image
            src={`data:${category.logoContentType};base64,${category.logoBase64}`}
            alt={label}
            width={14}
            height={14}
            className={`w-3.5 h-3.5 object-contain ${!isSelected && 'opacity-70'}`}
          />
        ) : Icon ? (
          <Icon className={`w-3.5 h-3.5 transition-colors duration-300 ${category.color} ${!isSelected && 'opacity-80'}`} />
        ) : null}
      </div>

      {/* Label */}
      <p className={`text-sm font-bold leading-tight transition-colors duration-300 ${category.color} ${!isSelected && 'opacity-80'}`}>
        {label}
      </p>

      {/* Report count */}
      <span className={`text-[9px] font-semibold transition-colors duration-300 ${category.color} ${!isSelected && 'opacity-60'}`}>
        {reportsCountTemplate.replace('{count}', String(count))}
      </span>
    </Button>
  );
}
