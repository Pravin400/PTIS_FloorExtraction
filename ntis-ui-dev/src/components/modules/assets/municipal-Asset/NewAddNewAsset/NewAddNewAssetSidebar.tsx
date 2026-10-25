import { Home, PlusSquare, Building2, Layers, Box, IndianRupee, Wrench, Shield, FileText, Map, BarChart3, Bell, Settings, BookOpen, Headphones, Database } from 'lucide-react';

const MENU_ITEMS = [
  { label: 'Dashboard', icon: Home, active: false },
  { label: 'Add New Asset', icon: PlusSquare, active: true },
  { label: 'Assets', icon: Box, active: false },
  { label: 'Property Details', icon: Building2, active: false },
  { label: 'Building & Floors', icon: Layers, active: false },
  { label: 'Associated Assets', icon: Database, active: false },
  { label: 'Valuation', icon: IndianRupee, active: false },
  { label: 'Maintenance', icon: Wrench, active: false },
  { label: 'Compliance', icon: Shield, active: false },
  { label: 'Documents', icon: FileText, active: false },
  { label: 'Maps & Plans', icon: Map, active: false },
  { label: 'Reports', icon: BarChart3, active: false },
  { label: 'Audit Trail', icon: FileText, active: false },
  { label: 'Alerts & Notes', icon: Bell, active: false },
  { label: 'Settings', icon: Settings, active: false },
];

export function NewAddNewAssetSidebar() {
  return (
    <div
      className="flex flex-col h-screen bg-[#0B1437] text-slate-300 shrink-0 overflow-hidden"
      style={{ width: 210 }}
    >
      {/* Logo + corporation name */}
      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-white/10">
        <div className="w-9 h-9 shrink-0 flex items-center justify-center">
          <AMCShield />
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[11px] font-black text-white leading-tight truncate">{'AKOLA MUNICIPAL'}</span>
          <span className="text-[11px] font-black text-white leading-tight truncate">{'CORPORATION, AKOLA'}</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full">
        <div className="space-y-0.5">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href="#"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-colors duration-150 ${
                  item.active
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="leading-tight">{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {/* Need Help panel */}
      <div className="mx-2 mb-2 rounded-lg bg-[#0F1E4A] border border-white/10 p-3">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{'Need Help?'}</p>
        <div className="space-y-0.5">
          <a href="#" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"><BookOpen className="w-3.5 h-3.5 shrink-0" /> {'User Manual'}</a>
          <a href="#" className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] font-medium text-slate-300 hover:bg-white/5 hover:text-white transition-colors"><Headphones className="w-3.5 h-3.5 shrink-0" /> {'Contact Support'}</a>
        </div>
      </div>
    </div>
  );
}

function AMCShield() {
  return (
    <svg viewBox="0 0 36 42" fill="none" xmlns="http://www.w3.org/2000/svg" width="36" height="42">
      <path d="M18 1L3 8V22C3 31 10 38.5 18 41C26 38.5 33 31 33 22V8L18 1Z" fill="#C0392B" />
      <path d="M18 4L5 10.5V22C5 30 11.5 37 18 39.5C24.5 37 31 30 31 22V10.5L18 4Z" fill="#E74C3C" />
      <path d="M18 7L8 12.5V22C8 28.5 12.5 34.5 18 37C23.5 34.5 28 28.5 28 22V12.5L18 7Z" fill="#F39C12" />
      {/* Pillar / building symbol */}
      <rect x="16" y="16" width="4" height="10" rx="0.5" fill="white" opacity="0.95" />
      <rect x="13.5" y="25" width="9" height="2" rx="0.5" fill="white" opacity="0.95" />
      <rect x="14.5" y="13.5" width="7" height="2.5" rx="0.5" fill="white" opacity="0.95" />
      <circle cx="18" cy="12" r="1.5" fill="white" opacity="0.95" />
    </svg>
  );
}
