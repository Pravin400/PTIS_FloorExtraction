'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/common';

export interface SidebarFrameProps {
  closeMenuLabel: string;
  openMenuLabel?: string;
  children: ReactNode;
}

/**
 * Client-only frame: mobile drawer toggle, overlay, and synced --sidebar-width for main/footer.
 * Menu markup is rendered on the server and passed as children.
 */
export function SidebarFrame({ closeMenuLabel, openMenuLabel = 'Open menu', children }: SidebarFrameProps) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Reset open state when pathname changes (React-recommended pattern for resetting state on prop change)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!collapsed) {
      document.body.classList.add('sidebar-expanded');
    } else {
      document.body.classList.remove('sidebar-expanded');
    }
    return () => document.body.classList.remove('sidebar-expanded');
  }, [collapsed]);

  useEffect(() => {
    const handleExpand = () => {
      setCollapsed(false);
      setOpen(true);
    };
    window.addEventListener('expand-sidebar', handleExpand);
    return () => {
      window.removeEventListener('expand-sidebar', handleExpand);
    };
  }, []);

  const toggleMobileNav = () => {
    setOpen(!open);
  };


  const isDarkTheme =
    pathname.includes('/assets') ||
    pathname.includes('/property-tax/ptis');

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="md"
        onClick={toggleMobileNav}
        aria-label={open ? closeMenuLabel : openMenuLabel}
        aria-expanded={open}
        aria-controls="mobile-sidebar"
        className={`sidebar-mobile-toggle lg:hidden fixed top-4 left-4 z-[60] backdrop-blur-xl p-3 rounded-xl border shadow-lg ${
          isDarkTheme
            ? 'bg-[#0B132B] hover:bg-[#152243] border-slate-700/80 text-white'
            : 'bg-[#4b70a6] hover:bg-[#3d5a8a] border-white/30 text-white'
        }`}
      >
        {open ? <X className="h-7 w-7 text-white" /> : <Menu className="h-7 w-7 text-white" />}
      </Button>

      {open && (
        <Button
          type="button"
          variant="ghost"
          aria-label={closeMenuLabel}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden border-0 p-0 cursor-pointer rounded-none h-full w-full"
          onClick={() => {
            setOpen(false);
            setCollapsed(true);
          }}
        />
      )}

      <aside
        id="mobile-sidebar"
        onMouseEnter={() => {
          if (typeof window !== 'undefined' && window.innerWidth >= 1024) setCollapsed(false);
        }}
        onMouseLeave={() => {
          if (typeof window !== 'undefined' && window.innerWidth >= 1024) setCollapsed(true);
        }}
        className={`
          fixed top-20 left-0 bottom-0 z-50 shadow-xl flex flex-col overflow-hidden
          transition-all duration-300 ease-in-out border-r
          ${
            pathname.includes('/assets')
              ? 'bg-gradient-to-b from-[#000428] to-[#004e92] border-white/10 text-slate-200'
              : isDarkTheme
                ? 'bg-[#0B132B] border-slate-800/80 text-slate-200'
                : 'bg-white border-gray-200 text-gray-800'
          }
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'w-16' : 'w-72 sidebar-expanded-aside'}
        `}
      >
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
      </aside>
    </>
  );
}

