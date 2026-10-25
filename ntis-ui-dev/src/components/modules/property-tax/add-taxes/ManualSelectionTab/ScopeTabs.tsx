import { Scope, ScopeItem } from '@/types/addTaxes.types';

interface ScopeTabsProps {
  scopes: ScopeItem[];
  selectedScope: Scope;
  handleScopeChange: (s: Scope) => void;
}

export function ScopeTabs({ scopes, selectedScope, handleScopeChange }: ScopeTabsProps) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-2">
      {scopes.map(s => {
        const isSelected = selectedScope === s.id;
        return (
          <div
            key={s.id}
            onClick={() => handleScopeChange(s.id as Scope)}
            className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all ${isSelected ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-2 text-[10px] font-bold ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {s.num}
            </div>
            <s.icon className={`h-5 w-5 mb-1.5 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
            <div className={`text-xs font-semibold mb-0.5 ${isSelected ? 'text-blue-600' : 'text-gray-800'}`}>{s.title}</div>
            <div className="text-[10px] text-gray-400 leading-tight">{s.desc}</div>
          </div>
        );
      })}
    </div>
  );
}
