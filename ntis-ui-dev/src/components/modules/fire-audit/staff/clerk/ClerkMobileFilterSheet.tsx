"use client";

import type { ComponentType } from "react";
import { Button, Badge } from "@/components/common";
import { ChevronDown, RotateCcw, X, Check, Search } from "lucide-react";
import { AdvancedFilterValues } from "./ClerkAdvancedFilter";
import { ClerkDateFilterPopover } from "./ClerkDateFilterPopover";

export interface FilterCardConfig {
    key: keyof AdvancedFilterValues;
    label: string;
    icon: ComponentType<{ className?: string }>;
    bg: string;
    options: { value: string; label: string }[];
}

interface ClerkMobileFilterSheetProps {
    isOpen: boolean;
    onClose: () => void;
    filters: AdvancedFilterValues;
    onFilterChange: (key: keyof AdvancedFilterValues, val: string) => void;
    onReset: () => void;
    onApply: () => void;
    openKey: string | null;
    setOpenKey: (key: string | null) => void;
    filterCards: FilterCardConfig[];
    activeCount: number;
    t: (key: string) => string;
}

export function ClerkMobileFilterSheet({
    isOpen, onClose, filters, onFilterChange, onReset, onApply,
    openKey, setOpenKey, filterCards, activeCount, t,
}: ClerkMobileFilterSheetProps) {
    if (!isOpen) return null;

    return (
        <div className="sm:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
            <style>{`
                .filter-pill-scroll {
                    overflow-y: scroll !important;
                    scrollbar-width: thin !important;
                    scrollbar-color: #94a3b8 transparent !important;
                    -webkit-overflow-scrolling: touch;
                }
                .filter-pill-scroll::-webkit-scrollbar { width: 5px !important; display: block !important; }
                .filter-pill-scroll::-webkit-scrollbar-track { background: transparent !important; margin: 6px 0 !important; }
                .filter-pill-scroll::-webkit-scrollbar-thumb { background-color: #94a3b8 !important; border-radius: 9999px !important; }
                .filter-pill-scroll::-webkit-scrollbar-thumb:hover { background-color: #64748b !important; }
            `}</style>
            <div className="absolute inset-0 cursor-default" onClick={onClose} aria-hidden="true" />
            <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-250 z-10 overflow-hidden">
                {/* Header */}
                <div className="px-4 pt-3 pb-2.5 shrink-0 border-b border-slate-100">
                    <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-2.5 shrink-0" />
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-800">{t("searchLabel")}</h2>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="xs" icon={RotateCcw} onClick={onReset} className="!text-xs font-semibold !text-[#1A86E8] hover:!bg-sky-50 !border-0 shadow-none cursor-pointer gap-1 px-2">
                                {t("btnReset")}
                            </Button>
                            <Button variant="ghost" size="xs" icon={X} onClick={onClose} className="!rounded-full !p-1.5 !text-slate-400 hover:!text-slate-600 !border-0 shadow-none cursor-pointer" aria-label={t("close")} />
                        </div>
                    </div>
                </div>

                {/* Body */}
                <div className="filter-pill-scroll flex-1 min-h-0 overflow-y-auto pl-4 pr-2.5 py-3 overscroll-contain">
                    <div className="grid grid-cols-2 gap-2 [grid-auto-flow:dense] pb-28">
                        {filterCards.map((item) => {
                            const Icon = item.icon;
                            const isOpened = openKey === item.key;
                            if (item.key === "appDate") {
                                return (
                                    <div
                                        key={item.key}
                                        className={`relative rounded-2xl border bg-white transition-all ${isOpened
                                            ? "col-span-2 border-[#1A86E8] ring-2 ring-sky-100 z-20"
                                            : "col-span-1 border-slate-200/90 hover:border-slate-300 z-10"
                                            }`}
                                    >
                                        <ClerkDateFilterPopover
                                            value={filters.appDate}
                                            onChange={(val) => onFilterChange("appDate", val)}
                                            isOpen={isOpened}
                                            onToggle={() => setOpenKey(isOpened ? null : item.key)}
                                            onClose={() => setOpenKey(null)}
                                            isMobile
                                            t={t}
                                        />
                                    </div>
                                );
                            }

                            const displayValue = (item.options.find((opt) => opt.value === filters[item.key]) || item.options[0]).label;
                            return (
                                <div
                                    key={item.key}
                                    className={`relative rounded-2xl border bg-white transition-all ${isOpened
                                        ? "border-[#1A86E8] ring-2 ring-sky-100 z-30"
                                        : "border-slate-200/90 hover:border-slate-300 z-10"
                                        }`}
                                >
                                    <button type="button" onClick={() => setOpenKey(isOpened ? null : item.key)} className="w-full flex items-center gap-2 p-2 text-left cursor-pointer focus:outline-none">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}><Icon className="w-4 h-4" /></div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] font-semibold text-slate-500 leading-none truncate">{item.label}</p>
                                            <p className="text-xs font-bold text-slate-800 leading-tight truncate mt-0.5">{displayValue}</p>
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpened ? "rotate-180 text-[#1A86E8]" : ""}`} />
                                    </button>
                                    {isOpened && (
                                        <div className="absolute top-[calc(100%+6px)] left-0 w-full min-w-[175px] z-40 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
                                            <div className="filter-pill-scroll max-h-48 overflow-y-auto space-y-0.5">
                                                {item.options.map((opt) => {
                                                    const isSelected = filters[item.key] === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            type="button"
                                                            onClick={() => { onFilterChange(item.key, opt.value); setOpenKey(null); }}
                                                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${isSelected ? "bg-sky-50 font-bold text-[#1A86E8]" : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                                                }`}
                                                        >
                                                            <span className="truncate pr-1">{opt.label}</span>
                                                            {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-[#1A86E8]" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 pt-3 border-t border-slate-100 shrink-0 bg-white z-20">
                    <Button variant="primary" size="md" icon={Search} onClick={onApply} className="!w-full !h-11 !bg-[#1A86E8] hover:!bg-[#1570c0] !text-white !rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.99] transition-all !border-transparent">
                        <span>{t("btnShowResults")}</span>
                        {activeCount > 0 && <Badge size="sm" className="bg-white/20 text-white border-transparent px-1.5 py-0 h-4 text-[10px] font-bold">{activeCount}</Badge>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
