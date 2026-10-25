import { Eye, ArrowRight, Building2, Activity } from 'lucide-react';

export function NAHeader() {
  return (
    <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
      {/* LEFT GROUP */}
      <div className="flex items-center gap-4">
        {/* AMC Logo + name */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Shield logo matching screenshot */}
          <div className="w-11 h-11 shrink-0 flex items-center justify-center">
            <AMCShieldLogo />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-black text-slate-800 leading-tight tracking-tight">{'AKOLA MUNICIPAL CORPORATION, AKOLA'}</span>
            <span className="text-[11px] font-semibold text-slate-500">{'Asset Management System'}</span>
          </div>
        </div>

        <div className="h-10 w-px bg-slate-200 mx-1" />

        {/* Asset Data Entry title */}
        <div>
          <h1 className="text-[17px] font-black text-slate-800 leading-tight">{'Asset Data Entry'}</h1>
          <p className="text-[11px] font-semibold text-blue-600">{'Create / Update Asset'}</p>
        </div>

        <div className="h-10 w-px bg-slate-200 mx-1" />

        {/* Dropdowns */}
        <div className="flex items-center gap-3">
          {/* Asset Type */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-black text-[#2d42db] uppercase tracking-widest">{'Asset Type'}</label>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm min-w-[130px]">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <select className="bg-transparent border-none outline-none text-[12px] font-bold text-[#1c2aab] flex-1 cursor-pointer appearance-none">
                <option value="building" className="text-[#1c2aab]">{'Building'}</option>
              </select>
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Asset Category */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] font-black text-[#2d42db] uppercase tracking-widest">{'Asset Category'}</label>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm min-w-[140px]">
              <Activity className="w-4 h-4 text-blue-600 shrink-0" />
              <select className="bg-transparent border-none outline-none text-[12px] font-bold text-[#1c2aab] flex-1 cursor-pointer appearance-none">
                <option value="hospital" className="text-[#1c2aab]">{'Hospital'}</option>
              </select>
              <svg className="w-3.5 h-3.5 text-slate-400 shrink-0 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: action buttons */}
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-[12px] font-bold hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
          <Eye className="w-4 h-4 text-slate-600" />{'Preview'}</button>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-[12px] font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30 cursor-pointer">
          {'Save & Next'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AMCShieldLogo() {
  return (
    <svg viewBox="0 0 44 50" fill="none" xmlns="http://www.w3.org/2000/svg" width="44" height="50">
      {/* Shield background */}
      <path d="M22 2L4 10V26C4 36.5 12.5 45 22 48C31.5 45 40 36.5 40 26V10L22 2Z" fill="#C0392B" />
      <path d="M22 5L7 12V26C7 35.2 14.2 43 22 46C29.8 43 37 35.2 37 26V12L22 5Z" fill="#E74C3C" />
      {/* Inner shield */}
      <path d="M22 9L10 15V26C10 33.5 15.5 40.2 22 43C28.5 40.2 34 33.5 34 26V15L22 9Z" fill="#F5A623" />
      {/* Center emblem - building/pillar symbol */}
      <rect x="19" y="18" width="6" height="12" rx="1" fill="white" opacity="0.9" />
      <rect x="16" y="28" width="12" height="2.5" rx="1" fill="white" opacity="0.9" />
    </svg>
  );
}
