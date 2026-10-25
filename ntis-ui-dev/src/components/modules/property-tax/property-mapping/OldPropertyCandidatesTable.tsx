/* eslint-disable react-hooks/set-state-in-effect */
import { useTranslations } from "next-intl";
import { useState, useEffect, useMemo } from "react";
import { MasterTable, Button, Checkbox } from "@/components/common";
import type { Column } from "@/components/common/MasterTable";
import { Eye, CheckCircle2, Unlink } from "lucide-react";
import { OldPropertyCandidate, CandidatesTableProps } from "@/types/property-mapping";
import { formatArea, isCandidateMatchingAny } from "./mappingUtils";

const formatMappedProperty = (propNo: string, ward?: string, partition?: string | null) => {
  if (!propNo) return "";
  if (propNo.includes("-") || propNo.includes(" ") || /^[A-Za-z]/.test(propNo)) {
    const cleaned = propNo.replace(/\s+/g, "");
    const parts = cleaned.split("-");
    if (parts.length > 0) {
      parts[0] = parts[0].toUpperCase();
    }
    for (let i = 1; i < parts.length; i++) {
      parts[i] = parts[i].toLowerCase();
    }
    return parts.join("-");
  }
  const formattedWard = ward ? ward.toUpperCase() : "";
  const formattedPartition = partition ? partition.toLowerCase() : "";
  return [formattedWard, propNo, formattedPartition].filter(Boolean).join("-");
};

export function CandidatesTable({
  autoCandidates,
  manualCandidates,
  activeCheckedIds,
  mappedOldPropNos,
  onToggleCandidate,
  onCompareClick,
  money,
  hasSearchActive,
  currentWard,
  currentPartition,
  currentPropNo,
  page12: propPage12,
  pageSize12: propPageSize12,
  totalCount12: propTotalCount12,
  onPageChange12,
  onPageSizeChange12,
  page13: propPage13,
  pageSize13: propPageSize13,
  totalCount13: propTotalCount13,
  onPageChange13,
  onPageSizeChange13,
  onDisconnectCandidate,
}: CandidatesTableProps & { onDisconnectCandidate?: (candidate: OldPropertyCandidate) => void }) {
  const t = useTranslations("propertyMapping");
  const areaUnit = t("candidatesTable.areaUnit");

  const allCandidates = useMemo(() => {
    const list = [...autoCandidates];
    manualCandidates.forEach(mc => {
      if (!list.some(item => item.id === mc.id)) {
        list.push(mc);
      }
    });
    return list;
  }, [autoCandidates, manualCandidates]);

  const isCandidateLinked = (c: OldPropertyCandidate) => {
    const isMappedThisSession = isCandidateMatchingAny(c, mappedOldPropNos);
    const isMappedToCurrent =
      isMappedThisSession ||
      (c.isMapped &&
        (c.mappedNewPropertyNo === currentPropNo ||
          c.belongsToNewId === currentPropNo ||
          (!c.mappedNewPropertyNo && c.status === "Mapped")));
    return Boolean(isMappedToCurrent);
  };

  const linkedCandidates = allCandidates.filter(isCandidateLinked);
  const unlinkedAuto = autoCandidates.filter((c) => !isCandidateLinked(c));
  const unlinkedManual = manualCandidates.filter((c) => !isCandidateLinked(c));

  const is12Occupied = unlinkedAuto.length > 0;

  const table12Data = is12Occupied ? unlinkedAuto : unlinkedManual;
  const table13Data = is12Occupied ? unlinkedManual : [];

  const [localPage11, setLocalPage11] = useState(1);
  const [localPageSize11, setLocalPageSize11] = useState(10);

  const [localPage12, setLocalPage12] = useState(1);
  const [localPageSize12, setLocalPageSize12] = useState(10);

  const [localPage13, setLocalPage13] = useState(1);
  const [localPageSize13, setLocalPageSize13] = useState(10);

  const page12 = propPage12 ?? localPage12;
  const pageSize12 = propPageSize12 ?? localPageSize12;

  const page13 = propPage13 ?? localPage13;
  const pageSize13 = propPageSize13 ?? localPageSize13;

  useEffect(() => {
    setLocalPage11(1);
  }, [linkedCandidates.length]);

  const totalCount11 = linkedCandidates.length;
  const totalPages11 = Math.max(1, Math.ceil(totalCount11 / localPageSize11));
  const safePage11 = Math.min(localPage11, totalPages11);
  const startIndex11 = (safePage11 - 1) * localPageSize11;
  const paginated11 = linkedCandidates.slice(startIndex11, startIndex11 + localPageSize11);

  const totalCount12 = propTotalCount12 !== undefined ? propTotalCount12 : table12Data.length;
  const totalPages12 = Math.max(1, Math.ceil(totalCount12 / pageSize12));
  const safePage12 = Math.min(page12, totalPages12);
  const paginated12 = onPageChange12 ? table12Data : table12Data.slice((safePage12 - 1) * pageSize12, safePage12 * pageSize12);

  const totalCount13 = propTotalCount13 !== undefined ? propTotalCount13 : table13Data.length;
  const totalPages13 = Math.max(1, Math.ceil(totalCount13 / pageSize13));
  const safePage13 = Math.min(page13, totalPages13);
  const paginated13 = onPageChange13 ? table13Data : table13Data.slice((safePage13 - 1) * pageSize13, safePage13 * pageSize13);

  const columns: Column<OldPropertyCandidate>[] = [
    {
      key: "id",
      label: t("candidatesTable.columns.selectMatch"),
      align: "center",
      width: "110px",
      render: (_, row) => {
        const isMapped = isCandidateMatchingAny(row, mappedOldPropNos) || (row.isMapped && (row.mappedNewPropertyNo === currentPropNo || !row.mappedNewPropertyNo));
        if (isMapped) {
          return (
            <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
          );
        }
        return (
          <Checkbox
            checked={activeCheckedIds.includes(row.id)}
            disabled={row.status === "Blocked"}
            onCheckedChange={() => onToggleCandidate(row.id)}
            className="mx-auto"
          />
        );
      },
    },
    {
      key: "status",
      label: t("candidatesTable.columns.status"),
      align: "center",
      width: "200px",
      render: (val, row) => {
        const isMappedThisSession = isCandidateMatchingAny(row, mappedOldPropNos);
        let displayVal = String(val);
        let isMappedToCurrent = false;

        if (isMappedThisSession || (row.isMapped && (row.mappedNewPropertyNo === currentPropNo || row.belongsToNewId === currentPropNo || !row.mappedNewPropertyNo))) {
          const targetPropNo = row.mappedNewPropertyNo || row.belongsToNewId || currentPropNo || "";
          const targetStr = formatMappedProperty(targetPropNo, currentWard, currentPartition);
          displayVal = t("candidatesTable.statusBadge.mappedTo", { propNo: targetStr });
          isMappedToCurrent = true;
        } else if (row.isMapped) {
          if (row.mappedNewPropertyNo) {
            const targetStr = formatMappedProperty(row.mappedNewPropertyNo, row.ward, row.partitionNo);
            displayVal = t("candidatesTable.statusBadge.mappedTo", { propNo: targetStr });
          } else {
            displayVal = t("candidatesTable.statusBadge.mapped");
            isMappedToCurrent = true;
          }
        }

        const isBlocked = row.status === "Blocked";
        const isMappedToOther = (row.isMapped || isMappedThisSession) && !isMappedToCurrent;
        const isConflictOrBlocked = isBlocked || isMappedToOther;

        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border whitespace-nowrap ${
            isMappedToCurrent
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : isConflictOrBlocked
              ? "bg-rose-50 text-rose-700 border-rose-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
          }`}>
            {displayVal}
          </span>
        );
      },
    },
    {
      key: "propNo",
      label: t("candidatesTable.columns.oldPropertyNo"),
      width: "140px",
      render: (val, row) => {
        const rawId = row.id.split("-")[0];
        const displayId = rawId && rawId !== "api" ? rawId : "";
        return (
          <div>
            <div className="font-extrabold text-slate-800 font-mono text-sm">
              {String(val)}{row.partitionNo ? ` / ${row.partitionNo}` : ""}
            </div>
            {displayId && (
              <div className="text-xs text-slate-400 font-mono mt-0.5 font-bold">ID {displayId}</div>
            )}
          </div>
        );
      },
    },
    {
      key: "owner",
      label: t("candidatesTable.columns.ownerAddress"),
      render: (val, row) => (
        <div className="leading-relaxed">
          <div className="font-extrabold text-slate-900 text-sm">{String(val)}</div>
          <div className="text-xs text-slate-500 mt-0.5 font-semibold">{row.address}</div>
        </div>
      ),
    },
    {
      key: "area",
      label: t("candidatesTable.columns.builtUpArea"),
      align: "center",
      width: "112px",
      render: (val) => (
        <span className="font-extrabold text-slate-900 text-sm">{formatArea(val as number)} {areaUnit}</span>
      ),
    },
    {
      key: "carpetArea",
      label: t("candidatesTable.columns.carpetArea"),
      align: "center",
      width: "112px",
      render: (val) => (
        <span className="font-extrabold text-slate-900 text-sm">{formatArea(val as number)} {areaUnit}</span>
      ),
    },
    {
      key: "tax",
      label: t("candidatesTable.columns.tax"),
      align: "center",
      width: "100px",
      render: (val) => (
        <span className="font-extrabold text-slate-900 text-sm font-mono">{money(Number(val))}</span>
      ),
    },
    {
      key: "floors",
      label: t("candidatesTable.columns.floors"),
      align: "center",
      width: "100px",
      render: (val) => (
        <span className="font-bold text-slate-700 font-mono text-xs">{String(val)}</span>
      ),
    },
    {
      key: "evidence",
      label: t("candidatesTable.columns.evidenceDetails"),
      align: "center",
      render: (_, row) => {
        const renderEvidenceText = (text: string) => {
          if (text.startsWith("Ward ")) {
            return t("evidence.ward", { wardNo: text.replace("Ward ", "") });
          }
          if (text.startsWith("Zone ")) {
            return t("evidence.zone", { zoneNo: text.replace("Zone ", "") });
          }
          if (text.startsWith("Category ")) {
            return t("evidence.category", { category: text.replace("Category ", "") });
          }
          return text;
        };

        return (
          <div className="flex flex-wrap justify-center gap-1.5">
            {row.evidence
              .filter((ev) => ev.text !== "Search Result")
              .map((ev, idx) => (
                <span
                  key={idx}
                  className={`px-1.5 py-0.5 rounded-md text-[11.5px] font-black border transition-all duration-150 hover:scale-105 cursor-help ${
                    ev.type === "good"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : ev.type === "warn"
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  }`}
                >
                  {renderEvidenceText(ev.text)}
                </span>
              ))}
          </div>
        );
      },
    },
    {
      key: "score",
      label: t("candidatesTable.columns.matchPercent"),
      align: "center",
      width: "90px",
      render: (val) => {
        const scoreVal = Number(val);
        let badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
        if (scoreVal >= 90) {
          badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
        } else if (scoreVal >= 70) {
          badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
        }
        return (
          <span className={`px-2 py-0.5 rounded-md text-xs font-black border font-mono ${badgeClass}`}>
            {scoreVal}%
          </span>
        );
      }
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* SECTION 1.1: Linked Historical Properties (Mapped) */}
      <section className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col gap-3">
        <div className="bg-emerald-50/50 border border-emerald-100/50 py-2.5 px-3.5 rounded-xl border-l-4 border-l-emerald-600">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
              {t("stepLabel", { step: 1 })}
            </span>
            <h3 className="text-base font-black text-slate-900 tracking-tight">
              {t("candidatesTable.step1.title", { count: linkedCandidates.length })}
            </h3>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 font-semibold">
            {t("candidatesTable.step1.description")}
          </p>
        </div>

        <MasterTable
          columns={columns}
          data={paginated11}
          emptyText={t("candidatesTable.step1.emptyText")}
          renderActions={(row) => (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => onCompareClick(row)}
                className={`p-1.5 border min-w-0 ${
                  row.isHardConflict
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                }`}
                icon={Eye}
                title={row.isHardConflict ? t("candidatesTable.compareButtonBlocked") : t("candidatesTable.compareButton")}
              />
              {onDisconnectCandidate && (
                <Button
                  variant="secondary"
                  size="xs"
                  onClick={() => onDisconnectCandidate(row)}
                  className="p-1.5 border min-w-0 bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                  icon={Unlink}
                  title="Unlink"
                />
              )}
            </div>
          )}
          actionLabel={t("candidatesTable.columns.action")}
          getRowKey={(row) => row.id}
          pageNumber={safePage11}
          pageSize={localPageSize11}
          totalCount={totalCount11}
          totalPages={totalPages11}
          onPageChange={(page) => setLocalPage11(page)}
          onPageSizeChange={(size) => {
            setLocalPageSize11(size);
            setLocalPage11(1);
          }}
          paginationConfig={{ enabled: true, showPageSizeSelector: true }}
          tableClassName="min-w-[900px]"
          rowClassName={() => {
            return `transition-all duration-200 hover:bg-slate-50/70 bg-emerald-50/10`;
          }}
        />
      </section>

      {/* SECTION 1.2: Available Candidates & Search Results */}
      {(hasSearchActive || table12Data.length > 0) && (
        <section className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col gap-3">
          <div className="bg-blue-50/70 border border-blue-100/50 py-2.5 px-3.5 rounded-xl border-l-4 border-l-blue-600">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                {t("stepLabel", { step: "1.1" })}
              </span>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                {t("candidatesTable.step2.title", { count: table12Data.length })}
                {is12Occupied ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                    {t("candidatesTable.step2.badgeAutoDetected")}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                    {t("candidatesTable.step2.badgeSearchResults")}
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-semibold">
              {is12Occupied
                ? t("candidatesTable.step2.descriptionAuto")
                : t("candidatesTable.step2.descriptionManual")}
            </p>
          </div>

          <MasterTable
            columns={columns}
            data={paginated12}
            emptyText={t("candidatesTable.step2.emptyText")}
            renderActions={(row) => (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => onCompareClick(row)}
                className={`p-1.5 border min-w-0 ${
                  row.isHardConflict
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                }`}
                icon={Eye}
                title={row.isHardConflict ? t("candidatesTable.compareButtonBlocked") : t("candidatesTable.compareButton")}
              />
            )}
            actionLabel={t("candidatesTable.columns.action")}
            getRowKey={(row) => row.id}
            pageNumber={safePage12}
            pageSize={pageSize12}
            totalCount={totalCount12}
            totalPages={totalPages12}
            onPageChange={(page) => {
              if (onPageChange12) onPageChange12(page);
              else setLocalPage12(page);
            }}
            onPageSizeChange={(size) => {
              if (onPageSizeChange12) onPageSizeChange12(size);
              else {
                setLocalPageSize12(size);
                setLocalPage12(1);
              }
            }}
            paginationConfig={{ enabled: true, showPageSizeSelector: true }}
            tableClassName="min-w-[900px]"
            rowClassName={(row) => {
              const isSearch = row.id.includes("-search") || !!row.isSearchResult;
              return `transition-all duration-200 hover:bg-slate-50/70 ${
                isSearch
                  ? "bg-violet-50/10"
                  : ""
              }`;
            }}
          />
        </section>
      )}

      {/* SECTION 1.3: Manual Search Results */}
      {table13Data.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs flex flex-col gap-3">
          <div className="bg-violet-50/70 border border-violet-100/50 py-2.5 px-3.5 rounded-xl border-l-4 border-l-violet-600">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-lg bg-violet-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                {t("stepLabel", { step: "1.2" })}
              </span>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                {t("candidatesTable.step3.title", { count: table13Data.length })}
                <span className="px-2 py-0.5 rounded-md bg-violet-600 text-white font-black text-[9px] uppercase tracking-wider shadow-xs">
                  {t("candidatesTable.step3.badgeManual")}
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-0.5 font-semibold">
              {t("candidatesTable.step3.description")}
            </p>
          </div>

          <MasterTable
            columns={columns}
            data={paginated13}
            emptyText={t("candidatesTable.step3.emptyText")}
            renderActions={(row) => (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => onCompareClick(row)}
                className={`p-1.5 border min-w-0 ${
                  row.isHardConflict
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                }`}
                icon={Eye}
                title={row.isHardConflict ? t("candidatesTable.compareButtonBlocked") : t("candidatesTable.compareButton")}
              />
            )}
            actionLabel={t("candidatesTable.columns.action")}
            getRowKey={(row) => row.id}
            pageNumber={safePage13}
            pageSize={pageSize13}
            totalCount={totalCount13}
            totalPages={totalPages13}
            onPageChange={(page) => {
              if (onPageChange13) onPageChange13(page);
              else setLocalPage13(page);
            }}
            onPageSizeChange={(size) => {
              if (onPageSizeChange13) onPageSizeChange13(size);
              else {
                setLocalPageSize13(size);
                setLocalPage13(1);
              }
            }}
            paginationConfig={{ enabled: true, showPageSizeSelector: true }}
            tableClassName="min-w-[900px]"
            rowClassName={() => {
              return `transition-all duration-200 hover:bg-slate-50/70`;
            }}
          />
        </section>
      )}
    </div>
  );
}
