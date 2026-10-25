'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { locales, localeNames, switchLocale, getLocaleFromPathname } from '@/i18n/config';

/**
 * LanguageDropdown - A reusable premium dropdown component for language switching.
 * Custom styled to blend seamlessly with the Thane Municipal Corporation application's design system.
 */
export function LanguageDropdown() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLocale = getLocaleFromPathname(pathname);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLanguageChange = (locale: typeof locales[number]) => {
    setIsOpen(false);
    switchLocale(locale, pathname, router);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Premium Glass-Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "group flex items-center gap-3 px-4 py-2 text-sm font-semibold rounded-xl shadow-lg transition-all duration-300 border",
          "bg-white/90 text-slate-800 border-white/50 shadow-slate-200/40 hover:bg-white hover:border-[#4b70a6]/40 hover:shadow-xl hover:shadow-[#4b70a6]/10 focus:outline-none focus:ring-2 focus:ring-[#4b70a6]/30",
          "backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]",
          isOpen && "border-[#4b70a6]/60 bg-white shadow-xl shadow-[#4b70a6]/10"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="p-1 bg-[#4b70a6]/10 rounded-lg text-[#4b70a6] shadow-inner transition-transform duration-300 group-hover:scale-110">
          <Globe className="h-4.5 w-4.5" strokeWidth={2} />
        </div>
        
        <span className="text-slate-700 tracking-wide font-semibold text-sm transition-colors duration-200 group-hover:text-[#4b70a6]">
          {localeNames[currentLocale]}
        </span>
        
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform duration-300",
            isOpen && "transform rotate-180 text-[#4b70a6]"
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-48 origin-top-right rounded-2xl bg-white/95 border border-slate-100 shadow-2xl ring-1 ring-black/5 focus:outline-none z-[9999] p-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1">
            {locales.map((locale) => {
              const isSelected = currentLocale === locale;
              return (
                <button
                  key={locale}
                  onClick={() => handleLanguageChange(locale)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-sm rounded-xl transition-all duration-200 text-left",
                    isSelected
                      ? "bg-gradient-to-r from-[#4b70a6]/10 to-[#638ecb]/5 text-[#4b70a6] font-bold border border-[#4b70a6]/20 shadow-sm"
                      : "text-slate-600 hover:bg-[#4b70a6]/5 hover:text-[#4b70a6] hover:pl-5"
                  )}
                >
                  <span className="tracking-wide font-semibold text-sm">{localeNames[locale]}</span>
                  
                  {isSelected && (
                    <div className="h-5 w-5 rounded-full bg-[#4b70a6] flex items-center justify-center shadow-sm shadow-[#4b70a6]/30">
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

