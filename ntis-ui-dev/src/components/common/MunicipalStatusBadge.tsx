import type { MunicipalStatusBadgeProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
export type { MunicipalStatusBadgeProps };




export function MunicipalStatusBadge({ status }: MunicipalStatusBadgeProps) {
  const normStatus = status.trim().toLowerCase();

  let bg = 'bg-[#EAF7EE]';
  let text = 'text-[#159447]';
  let border = 'border-[#EAF7EE]';

  if (normStatus === 'active' || normStatus === 'good' || normStatus === 'yes') {
    bg = 'bg-[#EAF7EE]';
    text = 'text-[#159447]';
    border = 'border-[#C2ECD3]';
  } else if (normStatus === 'in progress' || normStatus === 'pending') {
    bg = 'bg-[#FFF8E5]';
    text = 'text-[#E5A500]';
    border = 'border-[#FDECBF]';
  } else if (normStatus === 'overdue' || normStatus === 'no' || normStatus === 'inactive') {
    bg = 'bg-[#FEECEC]';
    text = 'text-[#EF3340]';
    border = 'border-[#F9C3C6]';
  }

  return (
    <span
      className={`inline-flex items-center justify-center text-[9px] font-bold px-2 py-0.5 rounded-full border ${bg} ${text} ${border} leading-none`}
    >
      {status}
    </span>
  );
}
