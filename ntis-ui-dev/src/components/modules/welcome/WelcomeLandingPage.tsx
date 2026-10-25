'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { resolveIcon } from '@/lib/utils/icon-mapping';
import { 
  Compass, 
  ShieldCheck, 
  HelpCircle, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface WelcomeLandingPageProps {
  translationKey: string;
  iconName: string;
}

export default function WelcomeLandingPage({ translationKey, iconName }: WelcomeLandingPageProps) {
  const tCommon = useTranslations('common');
  const tWelcome = useTranslations('welcome');
  const resolvedName = tCommon(translationKey);
  const welcomeText = tWelcome('welcomeTo', { name: resolvedName });



  const handleExploreClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('expand-sidebar'));
    }
  };

  return (
    <div className="relative min-h-[75vh] w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Abstract Background Accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Container */}
      <div className="relative w-full max-w-6xl bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl p-6 sm:p-10 md:p-14 shadow-2xl transition-all duration-500">
        <div className="flex flex-col items-center text-center">
          
          {/* Animated Themed Icon Badge */}
          <div className="relative flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-[#4b70a6] to-[#638ecb] rounded-2xl shadow-lg shadow-blue-500/20 mb-8 animate-pulse-slow">
            {React.createElement(resolveIcon(iconName), { className: 'w-10 h-10 text-white animate-bounce-subtle' })}
            <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 text-slate-900 p-1.5 rounded-lg shadow-md border-2 border-white">
              <Sparkles className="w-3.5 h-3.5 fill-yellow-500 text-yellow-600" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight leading-tight max-w-4xl mb-4">
            {welcomeText}
          </h1>

          {/* Divider */}
          <div className="w-24 h-1.5 bg-gradient-to-r from-blue-500/30 via-[#4b70a6] to-indigo-500/30 rounded-full mb-6" />

          {/* Subtext */}
          <p className="text-base sm:text-lg text-slate-500 font-medium max-w-3xl mb-12">
            {tWelcome('smartGovernance')} {tWelcome('securityPurpose')}
          </p>

          {/* Guidelines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
            
            {/* Card 1: Sidebar Navigation */}
            <div 
              onClick={handleExploreClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleExploreClick();
                }
              }}
              className="group bg-white/80 border border-slate-100 hover:border-blue-100 p-5 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col h-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                <Compass className="w-5 h-5 text-[#4b70a6]" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                {tWelcome('cards.exploreMenu.title')}
                <ArrowRight className="w-4 h-4 text-[#4b70a6] opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-4px] group-hover:translate-x-0 duration-300" />
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mt-auto">
                {tWelcome('cards.exploreMenu.description')}
              </p>
            </div>

            {/* Card 2: Security & Roles */}
            <div className="group bg-white/80 border border-slate-100 hover:border-indigo-100 p-5 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col h-full">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                {tWelcome('cards.secureAccess.title')}
                <ArrowRight className="w-4 h-4 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-4px] group-hover:translate-x-0 duration-300" />
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mt-auto">
                {tWelcome('cards.secureAccess.description')}
              </p>
            </div>

            {/* Card 3: Help & Assistance */}
            <div className="group bg-white/80 border border-slate-100 hover:border-amber-100 p-5 rounded-2xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] flex flex-col h-full">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
                <HelpCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                {tWelcome('cards.support.title')}
                <ArrowRight className="w-4 h-4 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-4px] group-hover:translate-x-0 duration-300" />
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mt-auto">
                {tWelcome('cards.support.description')}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
