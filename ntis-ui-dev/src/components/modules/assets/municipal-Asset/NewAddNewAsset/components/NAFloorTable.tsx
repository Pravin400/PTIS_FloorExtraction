import type { NAFloorTableProps } from "@/types/asset/municipal-Asset/new-add-new-asset";
import { Plus, Pencil, Trash2, Info } from 'lucide-react';
import { useNAFloorTableState } from '@/hooks/asset-hooks/floor-details/useNAFloorTableState';


export function NAFloorTable({ floors, onAdd, onEdit, onDelete, onGenerateUnits, showGenerateUnits = true, typeId }: NAFloorTableProps) {
  const PAGE_SIZE = 5;
  const {
    scrollContainerRef,
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedFloors,
    floorLevelMap,
    constructionTypeMap,
    useTypeMap,
    scrollDirection,
    handleChevronScroll,
  } = useNAFloorTableState({ floors, typeId, pageSize: PAGE_SIZE });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full flex-1">
      {/* Table header row */}
      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          {/* Floor plan icon */}
          <div className="w-5 h-5 flex items-center justify-center text-blue-600">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h3 className="text-[11.5px] font-black text-[#101b87]">{'Floor Submission'}</h3>
          <Info className="w-3 h-3 text-slate-400 cursor-help" />
        </div>
        <div className="flex items-center gap-2">
          {showGenerateUnits && onGenerateUnits && (
            <button
              onClick={onGenerateUnits}
              className="flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-200 text-blue-600 rounded-md text-[9.5px] font-bold hover:bg-blue-50 transition-colors shadow-sm cursor-pointer h-[24px]"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              {'Generate Units'}
            </button>
          )}
          <button
            onClick={onAdd}
            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-blue-200 text-blue-600 rounded-md text-[9.5px] font-bold hover:bg-blue-50 transition-colors shadow-sm cursor-pointer h-[24px]"
          >
            <Plus className="w-3 h-3" />{'Add Floor'}</button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-table-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-table-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-table-scrollbar::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 4px;
        }
        .custom-table-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
        .custom-table-scrollbar::-webkit-scrollbar-button:single-button {
          background-color: #cbd5e1;
          display: block;
          border-style: solid;
          height: 8px;
          width: 8px;
        }
        .custom-table-scrollbar::-webkit-scrollbar-button:single-button:decrement {
          border-width: 4px 6px 4px 0;
          border-color: transparent #475569 transparent transparent;
        }
        .custom-table-scrollbar::-webkit-scrollbar-button:single-button:increment {
          border-width: 4px 0 4px 6px;
          border-color: transparent transparent transparent #475569;
        }
      `}} />

      {/* Table Container */}
      <div className="overflow-x-auto custom-table-scrollbar flex-grow flex-1 min-h-0" ref={scrollContainerRef}>
        <table className="w-full text-left min-w-[2000px]" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr className="bg-[#EAF2FF] border-b border-slate-200">
              {[
                'SR NO.', 'AREA TYPE', 'FLOOR', 'SUB FLOOR', 'CON YR', 'ASST YR', 'CON TYPE',
                'TYPE OF USE', 'SUB TYPE OF USE', 'RENTER', 'ROOMS', 'CARPET (SQFT / SQM)',
                'BUILTUP (SQFT / SQM)', 'SDRR', 'BASE VALUE', 'FLOOR FACTOR', 'AGE FACTOR',
                'NTB FACTOR', 'USE FACTOR', 'CAPITAL VALUE', 'ACTION'
              ].map((h) => {
                const isAction = h === 'ACTION';
                return (
                  <th
                    key={h}
                    className={`py-1.5 px-2.5 text-[9px] font-black text-[#1e40af] tracking-wider whitespace-nowrap text-center border-r border-[#D0E2FF]/80 last:border-r-0 uppercase ${isAction ? 'sticky right-0 bg-[#EAF2FF] z-[21] shadow-[-2px_0_4px_rgba(0,0,0,0.05)] border-l border-[#D0E2FF]' : ''
                      }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{h}</span>
                      {isAction && (
                        <button
                          type="button"
                          onClick={handleChevronScroll}
                          className="w-[18px] h-[18px] flex items-center justify-center rounded bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] shadow-sm select-none cursor-pointer transition-colors shrink-0"
                        >
                          {scrollDirection === 'right' ? '›' : '‹'}
                        </button>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedFloors.length === 0 ? (
              <tr>
                <td colSpan={21} className="py-8 text-center text-[10px] font-bold text-slate-400 bg-slate-50/50 uppercase tracking-widest border border-slate-100">
                  {'No floor layouts registered. Click \'Add Floor\' or \'Generate Units\' to configure layouts.'}
                </td>
              </tr>
            ) : (
              paginatedFloors.map((floor, idx) => {
                return (
                  <tr key={floor.id} className="group border-b border-slate-100 hover:bg-slate-50/40 transition-colors [&>td]:border-r [&>td]:border-slate-100 [&>td:last-child]:border-r-0">
                    {/* SR NO. */}
                    <td className="py-1.5 px-2.5 text-[10px] font-bold text-slate-800 text-center whitespace-nowrap">
                      {(currentPage - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    {/* AREA TYPE */}
                    <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wide ${
                        String(floor.unitType || '').toLowerCase().includes('flat')
                          ? 'bg-blue-100 text-blue-700'
                          : String(floor.unitType || '').toLowerCase().includes('shop')
                          ? 'bg-amber-100 text-amber-700'
                          : String(floor.unitType || '').toLowerCase().includes('office')
                          ? 'bg-indigo-100 text-indigo-700'
                          : String(floor.unitType || '').toLowerCase().includes('open')
                          ? 'bg-emerald-100 text-emerald-700'
                          : String(floor.unitType || '').toLowerCase().includes('amenit')
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {floor.isDirectFloorSubmission
                          ? (floor.unitType === 'Open Space' ? 'Open Space' : 'Construction')
                          : (floor.unitType && floor.unitType !== 'Room' && floor.unitType !== 'Floor' ? floor.unitType : 'Construction')}
                      </span>
                    </td>
                    {/* FLOOR */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floorLevelMap.get(String(floor.floorId)) || floor.floorId || '-'}
                    </td>
                    {/* SUB FLOOR */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floor.subFloorName || floor.subFloorId || '-'}
                    </td>
                    {/* CON YR */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floor.constructionYear || '-'}
                    </td>
                    {/* ASST YR */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floor.assessmentYear || '-'}
                    </td>
                    {/* CON TYPE */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {constructionTypeMap.get(String(floor.constructionTypeId)) || floor.constructionTypeId || '-'}
                    </td>
                    {/* TYPE OF USE */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {useTypeMap.get(String(floor.typeOfUseId)) || floor.typeOfUseId || '-'}
                    </td>
                    {/* SUB TYPE OF USE */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floor.subTypeOfUseName || '-'}
                    </td>
                    {/* RENTER */}
                    <td className="py-1.5 px-2.5 text-center whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${floor.isRented ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {floor.isRented ? "Yes" : "No"}
                      </span>
                    </td>
                    {/* ROOMS */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floor.noOfRooms || (Array.isArray(floor.rooms) ? floor.rooms.length : 0)}
                    </td>
                    {/* CARPET (SQFT / SQM) */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floor.carpetAreaSqFeet ? `${floor.carpetAreaSqFeet.toFixed(2)} / ${(floor.carpetAreaSqFeet / 10.7639).toFixed(2)}` : '0.00 / 0.00'}
                    </td>
                    {/* BUILTUP (SQFT / SQM) */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floor.builtUpAreaSqFeet ? `${floor.builtUpAreaSqFeet.toFixed(2)} / ${(floor.builtUpAreaSqFeet / 10.7639).toFixed(2)}` : '0.00 / 0.00'}
                    </td>
                    {/* SDRR */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {Number(floor.cvBaseRate || 0).toLocaleString()}
                    </td>
                    {/* BASE VALUE */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {Number(floor.baseValue || 0).toLocaleString()}
                    </td>
                    {/* FLOOR FACTOR */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floor.cvFloorFactor != null && floor.cvFloorFactor !== '' ? Number(floor.cvFloorFactor).toFixed(2) : '-'}
                    </td>
                    {/* AGE FACTOR */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floor.cvAgeFactor != null && floor.cvAgeFactor !== '' ? Number(floor.cvAgeFactor).toFixed(2) : '-'}
                    </td>
                    {/* NTB FACTOR */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floor.cvNatureFactor != null && floor.cvNatureFactor !== '' ? Number(floor.cvNatureFactor).toFixed(2) : '-'}
                    </td>
                    {/* USE FACTOR */}
                    <td className="py-1.5 px-2.5 text-[10px] font-semibold text-slate-800 text-center whitespace-nowrap">
                      {floor.cvUseFactor != null && floor.cvUseFactor !== '' ? Number(floor.cvUseFactor).toFixed(2) : '-'}
                    </td>
                    {/* CAPITAL VALUE */}
                    <td className="py-1.5 px-2.5 text-[10px] font-bold text-slate-900 text-center whitespace-nowrap">
                      {Number(floor.capitalValue || 0) > 0 ? (
                        Number(floor.capitalValue || 0).toLocaleString()
                      ) : floor.cvCalculated === false ||
                        !floor.cvBaseRate ||
                        Number(floor.cvBaseRate) <= 0 ||
                        (Number(floor.cvFloorFactor || 0) === 0 &&
                          Number(floor.cvAgeFactor || 0) === 0 &&
                          Number(floor.cvNatureFactor || 0) === 0 &&
                          Number(floor.cvUseFactor || 0) === 0) ? (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-red-50 text-red-600">{'Not calculated'}</span>
                      ) : (
                        Number(floor.capitalValue || 0).toLocaleString()
                      )}
                    </td>
                    {/* ACTION */}
                    <td className="py-1.5 px-2.5 text-center whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-[-2px_0_4px_rgba(0,0,0,0.05)] border-l border-slate-100">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onEdit?.(floor.id)}
                          className="text-blue-600 hover:text-[#2435c2] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onDelete?.(floor.id)}
                          className="text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - only visible if floors count exceeds page size of 4 */}
      {floors.length > PAGE_SIZE && (
        <div className="px-3 py-1 flex items-center justify-between bg-[#FAFBFD] border-t border-slate-100 shrink-0 h-[28px]">
          <span className="text-[10px] text-slate-500 font-bold">{'Showing '} {((currentPage - 1) * PAGE_SIZE) + 1}&ndash;{Math.min(currentPage * PAGE_SIZE, floors.length)} {'of '} {floors.length}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-6 h-[20px] flex items-center justify-center border border-slate-200 rounded text-[10px] font-black bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-6 h-[20px] flex items-center justify-center rounded text-[10px] font-black transition-colors cursor-pointer ${currentPage === page
                    ? 'bg-blue-600 text-white shadow-sm font-black'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-6 h-[20px] flex items-center justify-center border border-slate-200 rounded text-[10px] font-black bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-sm"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
