'use client';

import { FileText } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  subtitle: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-4">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#004c8c]/10 to-[#800000]/10 flex items-center justify-center border border-[#004c8c]/10 shadow-sm">
          <FileText className="w-9 h-9 text-[#004c8c]/60" />
        </div>
        {/* decorative dots */}
        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#800000]/30 border-2 border-white" />
        <span className="absolute -bottom-1 -left-1 w-2 h-2 rounded-full bg-[#004c8c]/30 border-2 border-white" />
      </div>
      <div>
        <p className="font-bold text-gray-700 text-base">{title}</p>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>
    </div>
  );
}
