import React from 'react';
import Image from 'next/image';
import { FileText, Image as ImageIcon, Eye } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { AssetDetailData } from '@/types/asset/municipal-Asset/asset-detail.types';

export function DocumentThumb({
  doc,
  onClick,
}: {
  doc: AssetDetailData['documents'][0];
  index: number;
  onClick?: (url: string) => void;
}): React.ReactElement {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`View ${doc.name || 'document'}`}
      className="flex flex-col gap-1 cursor-pointer group flex-1 min-w-[60px] max-w-[80px]"
      onClick={() => onClick && doc.url ? onClick(doc.url) : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (onClick && doc.url) onClick(doc.url);
        }
      }}
    >
      <div className={cn("w-full aspect-[4/3] rounded border border-slate-200 overflow-hidden shadow-sm group-hover:shadow transition-shadow flex flex-col items-center justify-center relative", doc.thumbColor || 'bg-slate-50')}>
        {doc.icon === 'image' && doc.url ? (
          <Image unoptimized src={doc.url} alt={doc.name} fill className="object-cover" />
        ) : doc.icon === 'pdf' ? (
          <FileText className="w-6 h-6 text-red-500 mb-1" />
        ) : doc.icon === 'image' ? (
          <ImageIcon className="w-6 h-6 text-blue-500 mb-1" />
        ) : (
          <FileText className="w-6 h-6 text-slate-500 mb-1" />
        )}
        {!(doc.icon === 'image' && doc.url) && (
          <span className="text-[8px] font-black uppercase text-slate-500">{doc.type || 'DOC'}</span>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-sm">
            <Eye className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
      <div className="flex flex-col mt-0.5">
        <span className="text-[8.5px] text-blue-800 font-bold leading-tight truncate" title={doc.name}>
          {doc.name}
        </span>
      </div>
    </div>
  );
}
