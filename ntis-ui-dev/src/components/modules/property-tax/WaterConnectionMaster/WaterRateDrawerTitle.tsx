import { Droplets } from "lucide-react";

interface WaterRateDrawerTitleProps {
  title: string;
  subtitle: string;
}

export function WaterRateDrawerTitle({ title, subtitle }: WaterRateDrawerTitleProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 rounded-lg text-white">
        <Droplets size={20} />
      </div>
      <div>
        <div className="text-lg font-bold text-blue-900">{title}</div>
        <div className="text-sm text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}
