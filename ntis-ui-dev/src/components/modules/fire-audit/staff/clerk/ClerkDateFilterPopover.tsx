"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"] as const;
const WEEKDAY_KEYS = ["mo", "tu", "we", "th", "fr", "sa", "su"] as const;

export function CompactCalendar({
    value,
    onSelect,
    t,
}: {
    value?: string;
    onSelect: (d: string) => void;
    t: (k: string) => string;
}) {
    const initialDate = (() => {
        if (!value || ["all", "today", "week", "month"].includes(value)) return new Date();
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? new Date() : parsed;
    })();
    const [viewDate, setViewDate] = useState<Date>(initialDate);
    const y = viewDate.getFullYear(), m = viewDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDay = (new Date(y, m, 1).getDay() + 6) % 7;
    const daysInPrev = new Date(y, m, 0).getDate();

    const cells = [
        ...Array.from({ length: firstDay }, (_, i) => ({ d: daysInPrev - firstDay + 1 + i, cur: false, s: "" })),
        ...Array.from({ length: daysInMonth }, (_, i) => ({ d: i + 1, cur: true, s: `${y}-${String(m + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}` })),
    ];
    while (cells.length % 7 !== 0) cells.push({ d: cells.length % 7, cur: false, s: "" });

    return (
        <div className="w-[280px] bg-white rounded-2xl select-none mx-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <button
                    type="button"
                    onClick={() => setViewDate(new Date(y, m - 1, 1))}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                    aria-label={t("options.calendar.prevMonth")}
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1 font-semibold text-xs text-slate-800">
                    <select
                        value={m}
                        onChange={(e) => setViewDate(new Date(y, +e.target.value, 1))}
                        className="bg-transparent font-bold hover:text-[#1A86E8] cursor-pointer focus:outline-none"
                    >
                        {MONTH_KEYS.map((k, i) => (
                            <option key={k} value={i}>{t(`options.calendar.months.${k}`)}</option>
                        ))}
                    </select>
                    <select
                        value={y}
                        onChange={(e) => setViewDate(new Date(+e.target.value, m, 1))}
                        className="bg-transparent font-bold hover:text-[#1A86E8] cursor-pointer focus:outline-none"
                    >
                        {Array.from({ length: 41 }, (_, i) => 2000 + i).map((yr) => (
                            <option key={yr} value={yr}>{yr}</option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    onClick={() => setViewDate(new Date(y, m + 1, 1))}
                    className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                    aria-label={t("options.calendar.nextMonth")}
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center py-2 text-[11px] font-semibold text-slate-400">
                {WEEKDAY_KEYS.map((w) => (
                    <span key={w}>{t(`options.calendar.weekdays.${w}`)}</span>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
                {cells.map((c, i) => (
                    <button
                        key={i}
                        type="button"
                        disabled={!c.cur}
                        onClick={() => c.s && onSelect(c.s)}
                        className={`size-7 mx-auto flex items-center justify-center text-xs transition-all cursor-pointer rounded-full ${c.s === value ? "bg-[#1A86E8] text-white font-bold shadow-sm" :
                            c.cur ? "text-slate-700 hover:bg-slate-100" : "text-slate-300 pointer-events-none"
                            }`}
                    >
                        {c.d}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function ClerkDateFilterPopover({
    value, onChange, isOpen, onToggle, onClose, isMobile, t,
}: {
    value: string; onChange: (v: string) => void; isOpen: boolean; onToggle: () => void; onClose: () => void; isMobile?: boolean; t: (k: string) => string;
}) {
    const getLabel = () => {
        if (!value || value === "all") return t("options.appDate.all");
        if (["today", "week", "month"].includes(value)) return t(`options.appDate.${value}`);
        const [y, m, d] = value.split("-");
        return d && m && y ? `${d}/${m}/${y}` : value;
    };
    const presets = ["all", "today", "week", "month"].map((val) => ({ val, label: t(`options.appDate.${val}`) }));

    return (
        <div className={`relative ${isMobile ? "w-full" : "flex-1 min-w-[110px] max-w-[170px]"}`}>
            {isMobile ? (
                <button type="button" onClick={onToggle} className="w-full flex items-center gap-2 p-2 text-left cursor-pointer focus:outline-none">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 text-blue-500"><CalendarIcon className="w-4 h-4" /></div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold text-slate-500 leading-none truncate">{t("appDate")}</p>
                        <p className="text-xs font-bold text-slate-800 leading-tight truncate mt-0.5">{getLabel()}</p>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180 text-[#1A86E8]" : ""}`} />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onToggle}
                    className={`w-full flex items-center justify-between gap-1.5 bg-slate-50/80 hover:bg-slate-50 text-xs font-medium pl-7.5 pr-2.5 h-8 rounded-xl border transition-all shadow-2xs cursor-pointer text-slate-800 ${isOpen || (value && value !== "all") ? "border-[#1A86E8] ring-2 ring-[#1A86E8]/20 bg-white" : "border-slate-200"
                        }`}
                >
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0 absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none bg-blue-50 text-blue-500">
                        <CalendarIcon className="w-3 h-3" />
                    </div>
                    <span className="truncate">{getLabel()}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180 text-[#1A86E8]" : ""}`} />
                </button>
            )}

            {isOpen && (
                isMobile ? (
                    <div className="w-full pt-2 mt-2 border-t border-slate-100 animate-in fade-in-0 duration-150 flex flex-col items-center">
                        <div className="flex items-center justify-center gap-1 pb-2 mb-2 border-b border-slate-100 flex-wrap w-full">
                            {presets.map((p) => (
                                <button key={p.val} type="button" onClick={() => { onChange(p.val); onClose(); }} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${value === p.val ? "bg-[#1A86E8] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        <CompactCalendar value={value} onSelect={(d) => { onChange(d); onClose(); }} t={t} />
                    </div>
                ) : (
                    <>
                        <div className="fixed inset-0 z-40" onClick={onClose} />
                        <div className="absolute top-[calc(100%+6px)] left-0 z-50 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 w-[290px] animate-in fade-in-0 zoom-in-95 duration-150">
                            <div className="flex items-center gap-1 pb-2 mb-2 border-b border-slate-100 flex-wrap">
                                {presets.map((p) => (
                                    <button key={p.val} type="button" onClick={() => { onChange(p.val); onClose(); }} className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer ${value === p.val ? "bg-[#1A86E8] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            <CompactCalendar value={value} onSelect={(d) => { onChange(d); onClose(); }} t={t} />
                        </div>
                    </>
                )
            )}
        </div>
    );
}
