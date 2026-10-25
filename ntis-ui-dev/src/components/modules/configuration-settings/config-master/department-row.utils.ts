import { 
  Building2, 
  Droplets, 
  Store, 
  HardHat, 
  Baby, 
  LayoutGrid, 
  CheckCircle2, 
  XCircle,
  type LucideIcon 
} from 'lucide-react';

/**
 * Styling helper based on Dept Code
 */
export const getStyleForDept = (code: string): { bgColor: string; color: string } => {
  const upperCode = code?.toUpperCase();
  switch (upperCode) {
    case 'PTAX':
    case 'PT':
      return { bgColor: 'bg-blue-500', color: 'text-blue-600' };
    case 'WTAX':
    case 'WT':
      return { bgColor: 'bg-cyan-500', color: 'text-cyan-600' };
    case 'TL':
      return { bgColor: 'bg-amber-500', color: 'text-amber-600' };
    case 'BPA':
      return { bgColor: 'bg-emerald-500', color: 'text-emerald-600' };
    case 'BDR':
      return { bgColor: 'bg-purple-500', color: 'text-purple-600' };
    case 'AM':
      return { bgColor: 'bg-pink-500', color: 'text-pink-600' };
    case 'SWM':
      return { bgColor: 'bg-indigo-500', color: 'text-indigo-600' };
    case 'SL':
      return { bgColor: 'bg-teal-500', color: 'text-teal-600' };
    case 'FNOC':
      return { bgColor: 'bg-orange-500', color: 'text-orange-600' };
    default:
      return { bgColor: 'bg-slate-500', color: 'text-slate-600' };
  }
};

/**
 * Icon mapping based on department name/code
 */
export const getIconForDept = (deptName: string, deptCode?: string): LucideIcon => {
  const code = deptCode?.toUpperCase() || '';

  if (code === 'PTAX' || code === 'PT') return Building2;
  if (code === 'WTAX' || code === 'WT') return Droplets;
  if (code === 'TL') return Store;
  if (code === 'BPA') return HardHat;
  if (code === 'BDR') return Baby;
  if (code === 'AM') return LayoutGrid;
  if (code === 'SWM') return CheckCircle2;
  if (code === 'SL') return Building2;
  if (code === 'FNOC') return XCircle;

  const lower = deptName?.toLowerCase() || '';
  if (lower.includes('property')) return Building2;
  if (lower.includes('water')) return Droplets;
  if (lower.includes('trade')) return Store;
  if (lower.includes('building') || lower.includes('plan')) return HardHat;
  if (lower.includes('birth') || lower.includes('death')) return Baby;
  if (lower.includes('asset')) return LayoutGrid;
  if (lower.includes('solid') || lower.includes('waste')) return CheckCircle2;
  if (lower.includes('street') || lower.includes('light')) return Building2;
  if (lower.includes('fire') || lower.includes('noc')) return XCircle;

  return Building2;
};
