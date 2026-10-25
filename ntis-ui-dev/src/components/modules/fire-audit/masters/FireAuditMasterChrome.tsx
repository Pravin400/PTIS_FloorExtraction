"use client";

import React from "react";
import { SearchInput } from "@/components/common";
import { AddButton } from "@/components/common/ActionButtons";
import { cn } from "@/lib/utils/cn";

interface FireAuditMasterChromeProps {
  kicker: string;
  title: string;
  subtitle: string;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  addLabel?: string;
  onAdd?: () => void;
  viewOnlyNote?: string;
  children: React.ReactNode;
}

export function FireAuditMasterChrome({
  kicker,
  title,
  subtitle,
  search,
  onSearchChange,
  searchPlaceholder,
  addLabel,
  onAdd,
  viewOnlyNote,
  children,
}: FireAuditMasterChromeProps) {
  return (
    <div className="min-h-[calc(100dvh-12rem)] -mx-3 bg-[#f4f6f8] text-[#153746] sm:-mx-4">
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-[#b9381d] text-xs font-bold tracking-[0.04em] uppercase">
              {kicker}
            </p>
            <h1 className="mb-2 text-[#153746] text-[clamp(1.7rem,2.4vw,2.2rem)] font-extrabold leading-[1.15] tracking-[-0.03em] [text-wrap:balance]">
              {title}
            </h1>
            <p className="max-w-[68ch] text-[#586e7c] text-sm leading-relaxed [text-wrap:pretty]">
              {subtitle}
            </p>
          </div>
        </header>

        {viewOnlyNote && (
          <p className="mb-[14px] text-[#586e7c] text-xs">{viewOnlyNote}</p>
        )}

        <section
          className="overflow-hidden rounded-2xl border border-[#e6e8ec] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          aria-label={title}
        >
          <div className="flex flex-col gap-3 border-b border-[#eef0f3] p-4 sm:flex-row sm:items-end">
            <SearchInput
              value={search}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              className="mb-0 w-full min-w-0 flex-1 text-[#153746] sm:max-w-md"
            />
            {onAdd && addLabel && (
              <AddButton
                label={addLabel}
                onClick={onAdd}
                className={cn(
                  "!h-11 w-full !rounded-full !bg-[#e24b2a] !px-4 !text-white !shadow-none hover:!bg-[#c73d20] sm:w-auto"
                )}
              />
            )}
          </div>
          <div>{children}</div>
        </section>
      </div>
    </div>
  );
}
