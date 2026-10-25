/* eslint-disable i18next/no-literal-string */
"use client";

import React from "react";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { OkButton } from "@/components/common/ActionButtons";

export interface PenaltyRuleUserManualModalProps {
  open: boolean;
  onClose: () => void;
}

export function PenaltyRuleUserManualModal({
  open,
  onClose,
}: PenaltyRuleUserManualModalProps): React.ReactElement {
  return (
    <Modal
      open={open}
      onClose={onClose}
      maxWidth="lg"
      title="Penalty Rules — How It Works"
      footer={<OkButton onClick={onClose} />}
    >
      <div className="space-y-4 text-slate-700">
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Financial Year, Connection Category, and Penalty Rules work together to calculate late payment
          fees and interest on overdue water bills.
        </p>

        <div className="rounded-xl bg-[#F8FAFC] border border-blue-100/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 my-2">
          <div className="w-full sm:w-auto flex-1 rounded-xl bg-blue-50/70 border border-blue-200 px-4 py-3 flex items-center gap-3 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100/90 text-blue-600 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold text-blue-900 leading-tight">
                Financial Year &amp; Category
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                e.g. 2026-27, Residential, Commercial
              </div>
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />

          <div className="w-full sm:w-auto flex-1 rounded-xl bg-emerald-50/70 border border-emerald-200 px-4 py-3 flex items-center gap-3 shadow-xs">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100/90 text-emerald-600 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-semibold text-emerald-900 leading-tight">
                Penalty Rule
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                e.g. 1–30 Days (2%), 31+ Days (Monthly %)
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 py-1">
          <div className="flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>Financial Year &amp; Connection Category</strong> define the active policy period and eligible consumer categories for overdue penalty assessment.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              <strong>Penalty Rules</strong> define the overdue aging tiers (From Day to To Day) and assign each one a calculation type (Percentage, MonthlyPercentage, Flat Amount).
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Each rule can apply to Current Cycle Bills, accumulated Arrears Bills, or both — with optional maximum penalty caps (₹) — building the full penalty policy.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-[#FFF9F5] border border-orange-200/90 p-3.5 sm:p-4 text-xs text-orange-800 leading-relaxed">
          Always configure Financial Year and Connection Categories first, then add Penalty Rules that reference them — rules cannot calculate penalties without an active financial year.
        </div>
      </div>
    </Modal>
  );
}

export const PenaltyRuleInfoModal = PenaltyRuleUserManualModal;
