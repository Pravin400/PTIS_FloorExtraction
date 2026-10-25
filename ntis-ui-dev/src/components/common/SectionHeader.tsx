import type { SectionHeaderProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
export type { SectionHeaderProps };
import { Info } from 'lucide-react';



export function SectionHeader({
  title,
  actionText,
  onActionClick,
  onAction,
  infoIcon,
  rightElement,
  className = ''
}: SectionHeaderProps & { className?: string }) {
  const handleClick = onActionClick || onAction;

  return (
    <div className={`relative flex justify-center items-center w-full py-1.5 select-none ${className}`}>
      {/* Background horizontal line */}
      <div className="absolute inset-0 flex items-center px-2">
        <div className="w-full border-t border-[#002A9C]/30" />
      </div>

      {/* Centered Pill Badge */}
      <div className="relative z-10 flex items-center justify-between gap-2.5 bg-[#002A9C] text-white px-4 py-0.5 rounded-full shadow-xs max-w-fit mx-auto border border-[#001D6E]">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-white m-0 leading-none drop-shadow-xs">
            {title}
          </h3>
          {infoIcon && (
            <Info className="w-3.5 h-3.5 text-white/90 cursor-pointer" />
          )}
        </div>

        {actionText && (
          <button
            type="button"
            onClick={handleClick}
            className="text-[9px] font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full transition-colors flex items-center gap-0.5 cursor-pointer ml-1"
          >
            {actionText}
          </button>
        )}

        {rightElement && rightElement}
      </div>
    </div>
  );
}
