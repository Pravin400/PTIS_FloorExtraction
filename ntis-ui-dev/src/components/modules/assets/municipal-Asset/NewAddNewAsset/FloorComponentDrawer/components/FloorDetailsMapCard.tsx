import { Card, CardContent, CardHeader, CardTitle, Button } from "@/components/common";
import { Map, MapPin, Maximize2 } from "lucide-react";
import type { FloorDetailsMapCardProps } from "@/types/asset/floor-details.types";

export function FloorDetailsMapCard({ formData, setIsMapOpen }: FloorDetailsMapCardProps) {
  return (
    <Card variant="bordered" padding="sm" className="shadow-sm border-slate-200/80 bg-white rounded-2xl overflow-hidden">
      <CardHeader className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-3">
        <Map className="size-4 text-slate-500" />
        <CardTitle className="text-xs font-black text-slate-800 uppercase tracking-wider">
          {'Geo Location Map'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-center py-1">
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">{'Latitude'}</span>
            <span className="font-mono text-xs font-black text-slate-800">{formData.latitude || "19.0760"}</span>
          </div>
          <div className="text-center py-1 border-l border-slate-200">
            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">{'Longitude'}</span>
            <span className="font-mono text-xs font-black text-slate-800">{formData.longitude || "72.8777"}</span>
          </div>
        </div>

        <div 
          onClick={() => setIsMapOpen(true)}
          className="relative w-full h-44 border border-slate-200 rounded-xl overflow-hidden bg-slate-100 cursor-pointer shadow-inner group"
        >
          <div 
            className="absolute inset-0 bg-[#f8fafc]" 
            style={{ 
              backgroundImage: `
                linear-gradient(#e2e8f0 1.2px, transparent 1.2px),
                linear-gradient(90deg, #e2e8f0 1.2px, transparent 1.2px)
              `,
              backgroundSize: '30px 30px'
            }} 
          />
          <div className="absolute inset-0 pointer-events-none opacity-40" 
               style={{ backgroundImage: 'radial-gradient(#94a3b8 0.6px, transparent 0.6px)', backgroundSize: '8px 8px' }} 
          />

          <div className="absolute top-10 left-12 w-20 h-28 bg-blue-50/50 border border-blue-100 rounded-lg rotate-12" />
          <div className="absolute bottom-6 right-8 w-28 h-16 bg-emerald-50/50 border border-emerald-100 rounded-xl -rotate-6" />
          <div className="absolute top-1/2 left-1/2 w-48 h-6 bg-slate-200/50 border border-slate-300 rounded-full -translate-x-1/2 -translate-y-1/2" />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
            <div className="relative">
              <div className="absolute -top-1 size-8 bg-blue-500/20 rounded-full animate-ping border border-blue-500" />
              <MapPin className="size-7 text-blue-600 fill-blue-600/10 drop-shadow-md" />
            </div>
          </div>

          <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
            <Button 
              variant="ghost"
              type="button"
              className="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 cursor-pointer"
            >
              <Maximize2 className="size-3 text-blue-600" /> {'Adjust Pin Location'}
            </Button>
          </div>
        </div>

        <Button 
          variant="secondary"
          type="button"
          onClick={() => setIsMapOpen(true)}
          className="w-full h-9 bg-blue-50 hover:bg-blue-100 text-[#2d42db] border border-blue-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
        >
          <Map className="size-4" /> {'Pick Coordinates from Map'}
        </Button>
      </CardContent>
    </Card>
  );
}
