'use client';
/* eslint-disable i18next/no-literal-string */

import React from 'react';
import { Check, Scale, Edit3, Landmark } from 'lucide-react';

export const RetrospectiveHeroBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-50/70 via-pink-50/60 to-rose-50/80 border border-purple-100/80 p-6 md:p-8 mb-6 shadow-xs">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Left Content */}
        <div className="flex-1 space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
            Configurable retrospective assessment rules
          </h2>
          
          <p className="text-sm md:text-base text-gray-600 leading-relaxed">
            Convert corporation policies into transparent, testable decisions using separate retrospective-tax and unauthorized-construction penalty decisions, with evidence priority, start-date logic and legal look-back controls.
          </p>

          {/* Badge Pills */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            {/* Badge 1: 18 workbook rules */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/80 text-emerald-800 border border-emerald-200/60">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              <span>18 workbook rules + 1 added Thane rule</span>
            </div>

            {/* Badge 2: Legal validations */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100/80 text-purple-800 border border-purple-200/60">
              <Scale className="w-3.5 h-3.5 text-purple-600" />
              <span>Legal validations</span>
            </div>

            {/* Badge 3: Scenario testing */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100/80 text-amber-800 border border-amber-200/60">
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>Scenario testing</span>
            </div>
          </div>
        </div>

        {/* Right Icon Illustration Card */}
        <div className="hidden sm:flex items-center justify-center min-w-[5.5rem] h-22 rounded-2xl bg-white border border-purple-100/80 shadow-md p-4 self-center md:self-auto">
          <Landmark className="w-10 h-10 text-gray-800 stroke-[1.5]" />
        </div>
      </div>
    </div>
  );
};
