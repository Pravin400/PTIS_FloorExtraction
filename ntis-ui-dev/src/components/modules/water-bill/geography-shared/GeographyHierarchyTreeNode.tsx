"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { GeographyUnitHierarchyNode } from "@/types/water-bill/geographyUnit.types";

export interface LevelColor {
  badge: string;
  text: string;
  dot: string;
}

const LEVEL_COLORS: LevelColor[] = [
  { badge: "border-blue-200 bg-blue-50 text-blue-700", text: "text-blue-700", dot: "bg-blue-700" },
  { badge: "border-green-200 bg-green-50 text-green-700", text: "text-green-700", dot: "bg-green-700" },
  { badge: "border-amber-200 bg-amber-50 text-amber-700", text: "text-amber-700", dot: "bg-amber-600" },
  { badge: "border-violet-200 bg-violet-50 text-violet-700", text: "text-violet-700", dot: "bg-violet-700" },
  { badge: "border-rose-200 bg-rose-50 text-rose-700", text: "text-rose-700", dot: "bg-rose-700" },
];

export function getLevelColor(levelNo: number): LevelColor {
  const index = Math.max(0, levelNo - 1) % LEVEL_COLORS.length;
  return LEVEL_COLORS[index];
}

interface GeographyHierarchyTreeNodeProps {
  node: GeographyUnitHierarchyNode;
  depth?: number;
  defaultExpanded?: boolean;
}

export function GeographyHierarchyTreeNode({
  node,
  depth = 0,
  defaultExpanded = true,
}: GeographyHierarchyTreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = node.children.length > 0;
  const colors = getLevelColor(node.levelNo);

  return (
    <div className={cn("relative", depth > 0 && "ml-5 border-l border-dashed border-slate-300 pl-4")}>
      {depth > 0 && (
        <span
          aria-hidden="true"
          className="absolute -left-px top-5 w-4 border-t border-slate-300"
        />
      )}

      <div className="group flex min-h-9 items-center gap-1.5 rounded-md py- px-2 transition-colors hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-gray-200">
        <button
          type="button"
          onClick={() => hasChildren && setExpanded((previous) => !previous)}
          aria-label={hasChildren ? (expanded ? "Collapse" : "Expand") : undefined}
          aria-expanded={hasChildren ? expanded : undefined}
          disabled={!hasChildren}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400",
            hasChildren
              ? "hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
              : "invisible"
          )}
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>

        <span className={cn("h-2 w-2 shrink-0 rounded-full", colors.dot)} />
        <MapPin size={13} className={cn("shrink-0", colors.text)} aria-hidden="true" />

        <span className={cn("shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide", colors.badge)}>
          {node.geographyType}
        </span>

        <span className="min-w-0 truncate text-sm font-medium text-slate-800" title={node.geographyUnitName}>
          {node.geographyUnitName}
        </span>

        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
          {node.geographyUnitCode}
        </span>

        {hasChildren && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-1 text-[10px] font-semibold text-blue-700">
            {node.children.length}
          </span>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <GeographyHierarchyTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
