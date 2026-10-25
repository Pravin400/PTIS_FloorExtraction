import type { InfoRowProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
export type { InfoRowProps };

import { MunicipalStatusBadge } from './MunicipalStatusBadge';



export function InfoRow({ label, value, highlighted = false, isBadge = false }: InfoRowProps) {
  return (
    <div className="flex justify-between items-center py-[2px] text-[9.5px]">
      <span className="text-[#435272] font-medium">{label}</span>
      <span className={`font-bold text-[#0A1A44] ${highlighted ? 'text-[#0759E8]' : ''}`}>
        {isBadge ? <MunicipalStatusBadge status={String(value)} /> : value}
      </span>
    </div>
  );
}
