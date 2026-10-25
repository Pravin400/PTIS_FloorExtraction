'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/common";
import { useNAAssetForm } from "../../NAAssetFormContext";
import { ChildAssetDrawer } from "./ChildAssetDrawer";
import { Building2, Layers, Trash2 } from "lucide-react";
import { useFloorDetails } from "@/hooks/asset-hooks/useFloorDetails";
import { NewFloorForm } from "./FloorDetailsConfiguratorComponents";

export function FloorDetailsConfigurator() {
  const { formData, updateFormData } = useNAAssetForm();

  const {
    isChildDrawerOpen,
    setIsChildDrawerOpen,
    selectedFloorId,
    setSelectedFloorId,
    newFloor,
    setNewFloor,
    handleAddFloor,
    handleDeleteFloor,
    handleToggleFloor,
    allChecked,
    handleToggleAllFloors
  } = useFloorDetails(formData, updateFormData);

  return (
    <Card variant="bordered" padding="sm" className="shadow-sm border-slate-200/80 bg-white rounded-2xl">
      <CardHeader className="flex items-center gap-2.5 border-b border-slate-100 pb-1.5 mb-2">
        <div className="bg-[#0f172a] p-1.5 rounded-lg shadow-sm">
          <Layers className="size-4 text-white" />
        </div>
        <div className="flex-1">
          <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-wide">{'C) Construction & Floor Details'}</CardTitle>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{'Dynamic Floor Configurator Form & Valuation Table'}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <NewFloorForm
          newFloor={newFloor}
          setNewFloor={setNewFloor}
          handleAddFloor={handleAddFloor}
        />

        <div className="overflow-hidden border border-slate-200 rounded-xl shadow-inner bg-slate-50/20">
          <table className="w-full border-collapse text-left text-xs">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={handleToggleAllFloors}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-2.5 px-3">{'Floor Level'}</th>
                <th className="py-2.5 px-3">{'Con. Type'}</th>
                <th className="py-2.5 px-3">{'ASS Yr'}</th>
                <th className="py-2.5 px-3">{'Use Category'}</th>
                <th className="py-2 px-2 text-right">{'Carpet Area'}</th>
                <th className="py-2 px-2 text-right">{'Base Value (₹)'}</th>
                <th className="py-2 px-2 text-center w-24">{'Sub-Units'}</th>
                <th className="py-2 px-2 w-10 text-center">{'Delete'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {((formData.floors || []) as unknown as Array<Record<string, unknown>>).map((floor) => (
                <tr
                  key={Number(floor.id)}
                  className={`hover:bg-slate-50/60 transition-colors ${!floor.checked ? "opacity-50 line-through text-slate-400 bg-slate-50/20" : ""}`}
                >
                  <td className="py-2 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!floor.checked}
                      onChange={() => handleToggleFloor(Number(floor.id))}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-800">{String(floor.floor || floor.floorId || "")}</td>
                  <td className="py-2 px-3">{String(floor.conType || "")}</td>
                  <td className="py-2 px-3 font-mono">{String(floor.conYear || "�")} / {String(floor.asstYear || "�")}</td>
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[9px] font-bold uppercase tracking-wide">
                      {String(floor.useType || "")}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-[10px] text-slate-600">
                    {Number(floor.carpetAreaSqFt).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {'Sq.Ft'}
                  </td>
                  <td className="py-1 px-2 text-right font-mono font-bold text-slate-800">
                    {'₹ '}{Number(floor.baseValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-1 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFloorId(Number(floor.id));
                        setIsChildDrawerOpen(true);
                      }}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider w-full border border-blue-200 transition-colors"
                    >
                      <Building2 className="size-3" />
                      {String((floor.units as Array<unknown>)?.length || 0)} {'Units'}
                    </button>
                  </td>
                  <td className="py-1 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteFloor(Number(floor.id))}
                      className="p-1 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {(!formData.floors || formData.floors.length === 0) && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 font-bold uppercase tracking-wider">
                    {'No floors configured yet. Use the setup tool above to add levels.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>


      </CardContent>

      <ChildAssetDrawer
        isOpen={isChildDrawerOpen}
        onClose={() => {
          setIsChildDrawerOpen(false);
          setSelectedFloorId(null);
        }}
        floorId={selectedFloorId}
      />
    </Card>
  );
}

