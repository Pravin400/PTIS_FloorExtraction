'use client';

import { useState } from 'react';
import { Home, Camera, ListTodo, Shield, PhoneCall, X, Phone, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface MobileBottomNavBarProps {
  activeTab: 'home' | 'tracker' | 'admin';
  setActiveTab: (tab: 'home' | 'tracker' | 'admin') => void;
  displayTicketCount: string;
  onSnapClick: () => void;
}

export function MobileBottomNavBar({
  activeTab,
  setActiveTab,
  displayTicketCount,
  onSnapClick,
}: MobileBottomNavBarProps) {
  const t = useTranslations('grievance');
  const [isHelplineOpen, setIsHelplineOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Mobile Navigation Dock"
        className="bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] grid grid-cols-5 items-center justify-items-center relative shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pointer-events-auto z-30"
      >
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`w-full flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold cursor-pointer transition-all ${
            activeTab === 'home'
              ? 'text-emerald-600 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title={t('navHome')}
        >
          <Home className={`w-4.5 h-4.5 shrink-0 transition-transform ${activeTab === 'home' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="truncate max-w-full leading-tight px-0.5">{t('navHome')}</span>
        </button>

        {/* Tab 2: Tracker with Dynamic Badge */}
        <button
          type="button"
          onClick={() => setActiveTab('tracker')}
          className={`w-full flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold cursor-pointer transition-all relative ${
            activeTab === 'tracker'
              ? 'text-emerald-600 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title={t('navTrackerShort') || 'Tracker'}
        >
          <div className="relative">
            <ListTodo className={`w-4.5 h-4.5 shrink-0 transition-transform ${activeTab === 'tracker' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
            {displayTicketCount !== '0' && (
              <span className="absolute -top-1 -right-2.5 min-w-[15px] h-3.5 px-0.5 rounded-full bg-rose-500 ring-2 ring-white text-white text-[8.5px] font-black flex items-center justify-center shadow-xs">
                {displayTicketCount}
              </span>
            )}
          </div>
          <span className="truncate max-w-full leading-tight px-0.5">{t('navTrackerShort') || 'Tracker'}</span>
        </button>

        {/* Tab 3: EXACT 50% CENTER FLOATING CAMERA FAB */}
        <div className="w-full flex flex-col items-center justify-center relative -mt-6">
          <button
            type="button"
            onClick={onSnapClick}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 hover:from-emerald-500 hover:to-teal-300 text-white shadow-[0_8px_25px_rgba(16,185,129,0.45)] border-[3.5px] border-white flex flex-col items-center justify-center transition-all transform active:scale-90 hover:scale-105 cursor-pointer group shrink-0"
            title={t('newReportSnap') || 'Snap & Report Civic Issue'}
          >
            <Camera className="w-5.5 h-5.5 group-hover:scale-110 transition-transform stroke-[2.2]" />
            <span className="text-[8.5px] font-black tracking-tight leading-none mt-0.5 opacity-95">
              {t('navSnap') || 'Snap'}
            </span>
          </button>
        </div>

        {/* Tab 4: Helpline */}
        <button
          type="button"
          onClick={() => setIsHelplineOpen(true)}
          className="w-full flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold cursor-pointer transition-all text-slate-400 hover:text-emerald-600"
          title={t('helpline') || 'Helpline'}
        >
          <PhoneCall className="w-4.5 h-4.5 shrink-0 stroke-[1.8] group-hover:stroke-emerald-600" />
          <span className="truncate max-w-full leading-tight px-0.5">{t('helpline') || 'Helpline'}</span>
        </button>

        {/* Tab 5: Admin */}
        <button
          type="button"
          onClick={() => {
            if (typeof window !== 'undefined') {
              const loc = window.location.pathname.split('/')[1] || 'en';
              window.location.href = `/${loc}/grievance/complaints`;
            } else {
              setActiveTab('admin');
            }
          }}
          className={`w-full flex flex-col items-center justify-center gap-0.5 py-1 text-[10px] font-bold cursor-pointer transition-all ${
            activeTab === 'admin'
              ? 'text-emerald-600 scale-[1.02]'
              : 'text-slate-400 hover:text-slate-600'
          }`}
          title={t('navAdmin')}
        >
          <Shield className={`w-4.5 h-4.5 shrink-0 transition-transform ${activeTab === 'admin' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="truncate max-w-full leading-tight px-0.5">{t('navAdmin')}</span>
        </button>
      </nav>

      {/* Citizen Quick Civic Helpline Modal */}
      {isHelplineOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsHelplineOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-4 sm:p-5 shadow-2xl border border-slate-100 flex flex-col gap-3.5 animate-in slide-in-from-bottom duration-250"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <PhoneCall className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">
                    {t('helpline')}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {t('helpline24x7')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHelplineOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Helpline Cards */}
            <div className="space-y-2">
              {/* Primary Toll-Free */}
              <a
                href="tel:18002330123"
                className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/90 flex items-center justify-between hover:bg-emerald-100/80 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-900 block leading-tight">
                      {t('helplineTollFree')}
                    </span>
                    <span className="text-xs font-black text-emerald-700 tracking-wider">
                      1800-233-0123
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-1 rounded-lg shrink-0 group-hover:bg-emerald-700">
                  {t('callNow')}
                </span>
              </a>

              {/* Direct Landline */}
              <a
                href="tel:07212560333"
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 flex items-center justify-between hover:bg-slate-100 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-800 block leading-tight">
                      {t('helplineDisasterCell')}
                    </span>
                    <span className="text-xs font-black text-slate-700 tracking-wider">
                      0721-2560333
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-slate-800 text-white px-2.5 py-1 rounded-lg shrink-0 group-hover:bg-slate-900">
                  {t('callNow')}
                </span>
              </a>

              {/* Emergency Numbers Strip */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <a
                  href="tel:112"
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <span className="block text-[10px] font-semibold text-slate-500">{t('helplinePolice')}</span>
                  <span className="text-xs font-black text-slate-900">112</span>
                </a>
                <a
                  href="tel:101"
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <span className="block text-[10px] font-semibold text-slate-500">{t('helplineFire')}</span>
                  <span className="text-xs font-black text-rose-600">101</span>
                </a>
                <a
                  href="tel:108"
                  className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <span className="block text-[10px] font-semibold text-slate-500">{t('helplineAmbulance')}</span>
                  <span className="text-xs font-black text-amber-600">108</span>
                </a>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 font-medium">
              {t('helplineFooter')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
