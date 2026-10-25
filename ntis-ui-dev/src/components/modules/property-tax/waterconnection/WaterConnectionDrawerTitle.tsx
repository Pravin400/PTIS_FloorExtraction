import { Droplets } from "lucide-react";

interface WaterConnectionDrawerTitleProps {
  title: string;
  subtitle: string;
  propertyNo?: string;
}

export function WaterConnectionDrawerTitle({
  title,
  subtitle,
 
}: WaterConnectionDrawerTitleProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-600 to-blue-700 flex items-center justify-center shrink-0 shadow-sm">
        <Droplets className="w-4 h-4 text-white" />
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900 leading-tight">{title}</h2>
         
        </div>
        <p className="text-[11px] text-gray-500 leading-tight">{subtitle}</p>
      </div>
    </div>
  );
}
