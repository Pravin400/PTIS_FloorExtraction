'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Home, ClipboardCheck, History, User } from 'lucide-react';

export interface SurveyorBottomNavProps { className?: string; assignedCount?: number; }

const NAV_ITEMS = [
  { key: 'home', icon: Home, path: '' }, { key: 'inspections', icon: ClipboardCheck, path: '/inspections', withBadge: true },
  { key: 'history', icon: History, path: '/history' }, { key: 'profile', icon: User, path: '/profile' },
] as const;

const ROUTE_KEYS = ['profile', 'history', 'inspections'];

const getNavPath = (xc: number, w: number, h = 60, r = 30) => {
  const [dipW, dipH] = [40, 21];
  const [lx, rx] = [Math.max(r, xc - dipW), Math.min(w - r, xc + dipW)];
  return `M ${r} 0 H ${lx} C ${xc - 22} 0, ${xc - 18} ${dipH}, ${xc} ${dipH} C ${xc + 18} ${dipH}, ${xc + 22} 0, ${rx} 0 H ${w - r} A ${r} ${r} 0 0 1 ${w} ${r} A ${r} ${r} 0 0 1 ${w - r} ${h} H ${r} A ${r} ${r} 0 0 1 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 Z`;
};

export function SurveyorBottomNav({ className = '', assignedCount = 5 }: SurveyorBottomNavProps) {
  const pathname = usePathname() || '', locale = useLocale();
  const t = useTranslations('fireAuditSurveyor.sidebar');

  const navRef = useRef<HTMLElement>(null);
  const [dockWidth, setDockWidth] = useState(360);
  const [touchActive, setTouchActive] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false), [isDocketOpen, setIsDocketOpen] = useState(false);

  // Responsive dock measurement & mobile listeners (map drag + docket open)
  useEffect(() => {
    if (!navRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      if (e?.contentRect.width > 0) setDockWidth(e.contentRect.width);
    });
    ro.observe(navRef.current);
    const onMapMove = (e: Event) => setIsMapMoving(Boolean((e as CustomEvent<{ isMoving: boolean }>).detail?.isMoving));
    const onDocket = (e: Event) => setIsDocketOpen(Boolean((e as CustomEvent<{ isOpen: boolean }>).detail?.isOpen));
    window.addEventListener('ntis:map-moving', onMapMove);
    window.addEventListener('ntis:docket-open', onDocket);
    return () => {
      ro.disconnect();
      window.removeEventListener('ntis:map-moving', onMapMove);
      window.removeEventListener('ntis:docket-open', onDocket);
    };
  }, []);

  // Active tab index resolution
  const activeIndex = useMemo(() => {
    const idx = ROUTE_KEYS.findIndex((r) => pathname.includes(r));
    return idx >= 0 ? 3 - idx : 0;
  }, [pathname]);

  // Geometry: fluid tab centers across dock width
  const height = 60, padX = 20;
  const tabWidth = Math.max(100, dockWidth - padX * 2) / NAV_ITEMS.length;
  const targetX = padX + tabWidth * activeIndex + tabWidth / 2;

  // 60fps cubic-eased glide interpolator: synchronizes SVG path cutout & active bubble
  const [activeX, setActiveX] = useState(targetX);
  const activeXRef = useRef(targetX);

  useEffect(() => {
    const start = activeXRef.current;
    const target = targetX;
    if (Math.abs(start - target) < 0.5) return;

    let frame: number;
    const startTime = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - startTime) / 300, 1);
      const nextX = start + (target - start) * (1 - Math.pow(1 - p, 3));
      activeXRef.current = nextX;
      setActiveX(nextX);
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [targetX]);

  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => setTouchActive(false), 800);
  }, []);

  const ActiveIcon = NAV_ITEMS[activeIndex]?.icon ?? Home;
  const isCompact = isMapMoving && !touchActive;

  return (
    <nav
      ref={navRef}
      aria-label="Surveyor Curved Scoop Navigation Dock"
      onTouchStart={() => setTouchActive(true)}
      onTouchEnd={handleTouchEnd}
      className={`lg:hidden fixed bottom-3 sm:bottom-4 inset-x-3.5 sm:inset-x-4 max-w-md mx-auto h-15 z-40 select-none transition-all duration-300 ease-out will-change-transform ${
        isDocketOpen
          ? 'translate-y-28 opacity-0 pointer-events-none'
          : isCompact
          ? 'scale-[0.85] translate-y-3 opacity-70'
          : 'scale-100 translate-y-0 opacity-100'
      } ${className}`}
    >
      <div className="relative w-full h-full">
        {/* Dynamic Curved Cutout Path */}
        <svg
          viewBox={`0 0 ${dockWidth} ${height}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ filter: 'drop-shadow(0 12px 28px rgba(15, 23, 42, 0.12)) drop-shadow(0 2px 6px rgba(15, 23, 42, 0.06))' }}
        >
          <path d={getNavPath(activeX, dockWidth)} fill="#FFFFFF" stroke="rgba(203, 213, 225, 0.90)" strokeWidth="1.5" />
        </svg>

        {/* Elevated Floating Flame Active Bubble */}
        <div
          style={{
            left: `${activeX}px`,
            transform: 'translateX(-50%)',
            boxShadow: '0 8px 20px rgba(234, 88, 12, 0.42), inset 0 1.5px 2px rgba(255, 255, 255, 0.70), inset 0 -2px 3px rgba(0, 0, 0, 0.15)',
          }}
          className="absolute -top-[33px] w-11.5 h-11.5 rounded-full bg-linear-to-tr from-orange-600 via-orange-500 to-amber-500 border-2 border-white flex items-center justify-center pointer-events-none z-20 will-change-transform"
        >
          <ActiveIcon className="w-5 h-5 text-white" />
        </div>

        {/* 4 Fluid Tab Slots */}
        <div style={{ paddingLeft: `${padX}px`, paddingRight: `${padX}px` }} className="relative z-10 w-full h-full flex items-stretch">
          {NAV_ITEMS.map((item, idx) => {
            const isActive = idx === activeIndex;
            const Icon = item.icon;
            const label = t(item.key);
            const href = `/${locale}/fire-audit/surveyor${item.path}`;

            return (
              <Link
                key={item.key}
                href={href}
                aria-label={label}
                className="flex-1 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform relative group"
              >
                <div className={`flex flex-col items-center justify-center ${isActive ? 'pt-2' : 'pt-0.5'}`}>
                  {isActive ? <div className="h-4 w-4" aria-hidden="true" /> : (
                    <div className="relative">
                      <Icon className="w-4.5 h-4.5 text-slate-500 group-hover:text-slate-900 group-hover:scale-110 transition-all" />
                      {'withBadge' in item && assignedCount > 0 && (
                        <span className="absolute -top-1 -right-2.5 min-w-[15px] h-[15px] px-1 rounded-full bg-orange-600 text-white text-[8.5px] font-extrabold flex items-center justify-center border border-white shadow-xs">{assignedCount}</span>
                      )}
                    </div>
                  )}
                  <span className={`text-[10px] font-devanagari leading-tight transition-colors ${isActive ? 'font-bold text-orange-600 mt-0.5' : 'font-semibold text-slate-600 group-hover:text-slate-900 mt-1'}`}>
                    {label}
                  </span>
                  {isActive && <span className="w-1 h-1 rounded-full bg-orange-600 shadow-[0_0_6px_rgba(234,88,12,0.7)] mt-0.5" />}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
