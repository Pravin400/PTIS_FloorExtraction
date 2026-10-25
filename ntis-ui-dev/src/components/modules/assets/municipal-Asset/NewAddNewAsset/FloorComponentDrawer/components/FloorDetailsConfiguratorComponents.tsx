import { Sparkles, Plus } from "lucide-react";
import { Input, Select, AnimatedDigitInput } from "@/components/common";
import type { NewFloorFormProps } from "@/types/asset/floor-details.types";

export function NewFloorForm({ newFloor, setNewFloor, handleAddFloor }: NewFloorFormProps) {
  return (
    <div className="bg-slate-50/70 p-2 rounded-xl border border-slate-200/60 space-y-2">
      <div className="flex items-center gap-1.5">
        <Sparkles className="size-3.5 text-blue-500 animate-pulse" />
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{'Configure New Floor Level'}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Select
          label="Floor"
          options={[
            { label: "Ground", value: "Ground" },
            { label: "1st", value: "1st" },
            { label: "2nd", value: "2nd" },
            { label: "3rd", value: "3rd" },
            { label: "4th", value: "4th" },
            { label: "5th", value: "5th" },
            { label: "6th", value: "6th" },
          ]}
          value={newFloor.floor}
          onChange={(_e, val) => setNewFloor((prev: Record<string, unknown>) => ({ ...prev, floor: val }))}
          selectSize="sm"
          className="text-xs"
        />

        <Select
          label="Con Type"
          options={[
            { label: "RCC", value: "RCC" },
            { label: "Load Bearing", value: "Load Bearing" },
            { label: "Steel Frame", value: "Steel Frame" },
            { label: "Wooden", value: "Wooden" },
          ]}
          value={newFloor.conType}
          onChange={(_e, val) => setNewFloor((prev: Record<string, unknown>) => ({ ...prev, conType: val }))}
          selectSize="sm"
          className="text-xs"
        />

        <div className="flex flex-col w-full h-full justify-end">
          <AnimatedDigitInput
            label="Con Yr"
            placeholder="e.g. 2024"
            value={newFloor.conYear || ""}
            onChange={(val) => setNewFloor((prev: Record<string, unknown>) => ({ ...prev, conYear: val }))}
            className="h-8 py-1 text-xs border-slate-300"
            fullWidth={true}
          />
        </div>

        <div className="flex flex-col w-full h-full justify-end">
          <AnimatedDigitInput
            label="ASS Yr"
            placeholder="e.g. 2024"
            value={newFloor.asstYear || ""}
            onChange={(val) => setNewFloor((prev: Record<string, unknown>) => ({ ...prev, asstYear: val }))}
            className="h-8 py-1 text-xs border-slate-300"
            fullWidth={true}
          />
        </div>

        <Select
          label="Use Type"
          options={[
            { label: "Residential", value: "Residential" },
            { label: "Commercial", value: "Commercial" },
            { label: "Industrial", value: "Industrial" },
            { label: "Mixed Use", value: "Mixed Use" },
          ]}
          value={newFloor.useType}
          onChange={(_e, val) => setNewFloor((prev: Record<string, unknown>) => ({ ...prev, useType: val }))}
          selectSize="sm"
          className="text-xs"
        />

        <Select
          label="Sub Use"
          options={[
            { label: "Bungalow", value: "Bungalow" },
            { label: "Duplex", value: "Duplex" },
            { label: "Shop", value: "Shop" },
            { label: "Office", value: "Office" },
            { label: "Storage", value: "Storage" },
          ]}
          value={newFloor.subUseType}
          onChange={(_e, val) => setNewFloor((prev: Record<string, unknown>) => ({ ...prev, subUseType: val }))}
          selectSize="sm"
          className="text-xs"
        />

        <Input
          label="Rooms"
          type="number"
          value={newFloor.rooms}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFloor((prev: Record<string, unknown>) => ({ ...prev, rooms: Number(e.target.value) }))}
          className="h-8 py-1 text-xs px-2.5 border-slate-300"
        />

        <Input
          label="Built-Up Area (Sq.Ft)"
          type="number"
          value={newFloor.builtUpAreaSqFt}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFloor((prev: Record<string, unknown>) => ({ ...prev, builtUpAreaSqFt: Number(e.target.value) }))}
          className="h-8 py-1 text-xs px-2.5 border-slate-300"
        />

        <Input
          label="Carpet Area (Sq.Ft)"
          type="number"
          value={newFloor.carpetAreaSqFt}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFloor((prev: Record<string, unknown>) => ({ ...prev, carpetAreaSqFt: Number(e.target.value) }))}
          className="h-8 py-1 text-xs px-2.5 border-slate-300"
        />

        <Input
          label="Base Value (₹)"
          type="number"
          value={newFloor.baseValue}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewFloor((prev: Record<string, unknown>) => ({ ...prev, baseValue: Number(e.target.value) }))}
          className="h-8 py-1 text-xs px-2.5 border-slate-300 font-bold text-slate-800"
        />

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAddFloor}
            className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider transition-all shadow-sm shadow-blue-100 cursor-pointer"
          >
            <Plus className="size-3.5" strokeWidth={3} /> {'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
