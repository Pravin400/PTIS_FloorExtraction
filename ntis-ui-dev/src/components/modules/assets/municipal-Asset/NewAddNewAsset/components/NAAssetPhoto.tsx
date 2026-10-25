'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Plus } from 'lucide-react';

export function NAAssetPhoto() {
  const [activeThumb, setActiveThumb] = useState(0);
  const thumbs: string[] = [];
  const mains: string[] = [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
      {/* Card header */}
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          <h3 className="text-[12px] font-black text-[#101b87]">{'Asset Photo'}</h3>
        </div>
        <button className="flex items-center gap-1 px-2 py-0.5 bg-white border border-blue-200 rounded-md text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors shadow-sm cursor-pointer">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          {'Change Photo'}
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2 justify-between flex-1 min-h-0">
        {/* Main image */}
        <div className="w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center flex-1 min-h-0">
          {mains[activeThumb] ? (
            <Image
              src={mains[activeThumb]}
              alt="Asset Main View"
              unoptimized
              width={400}
              height={300}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-slate-400 p-4">
              <span className="text-xs font-semibold">{'No Photo Available'}</span>
            </div>
          )}
        </div>

        {/* Square Thumbnail row matching Image 2 */}
        <div className="flex gap-2 shrink-0 h-[50px] w-full items-center">
          {thumbs.map((src, i) => (
            <button
              key={i}
              onClick={() => setActiveThumb(i)}
              className={`aspect-square h-full rounded-lg overflow-hidden border-2 transition-all bg-slate-50 shrink-0 cursor-pointer ${
                activeThumb === i ? 'border-blue-600 ring-1 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Image src={src} alt={`thumbnail ${i + 1}`} unoptimized width={50} height={50} className="w-full h-full object-cover" />
            </button>
          ))}

          {/* Square Upload tile */}
          <button
            className="aspect-square h-full rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center hover:bg-[#FAFBFD] hover:border-blue-400 transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-blue-500" />
            <span className="text-[8px] font-black text-slate-500 mt-0.5 leading-none">{'Upload'}</span>
          </button>
        </div>

        {/* Caption */}
        <p className="text-[9px] text-slate-400 font-semibold leading-none shrink-0">{'Upload min. 1 photo (JPG, PNG)'}</p>
      </div>
    </div>
  );
}
