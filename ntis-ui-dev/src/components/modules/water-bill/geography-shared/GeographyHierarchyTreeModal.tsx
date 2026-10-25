"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Network, SquareMinus, SquarePlus } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common";
import { OkButton } from "@/components/common/ActionButtons";
import { cn } from "@/lib/utils/cn";
import { fetchGeographyUnitHierarchyTreeAction } from "@/app/[locale]/water-bill/geography-unit-master/action";
import type { GeographyUnitHierarchyNode } from "@/types/water-bill/geographyUnit.types";
import { GeographyHierarchyTreeNode, getLevelColor } from "./GeographyHierarchyTreeNode";

interface GeographyLevelLegend {
  levelNo: number;
  geographyType: string;
}

function collectLevels(
  nodes: GeographyUnitHierarchyNode[],
  levels = new Map<number, GeographyLevelLegend>()
): Map<number, GeographyLevelLegend> {
  nodes.forEach((node) => {
    if (!levels.has(node.levelNo)) {
      levels.set(node.levelNo, {
        levelNo: node.levelNo,
        geographyType: node.geographyType,
      });
    }
    collectLevels(node.children, levels);
  });

  return levels;
}

export function GeographyHierarchyTreeModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("geographyShared.hierarchyTree");

  const isOpen = searchParams.get("showHierarchyTree") === "true";

  const [tree, setTree] = useState<GeographyUnitHierarchyNode[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [expandNodes, setExpandNodes] = useState(true);
  const [expansionSignal, setExpansionSignal] = useState(0);
  const loading = isOpen && !loaded;
  const levelLegend = useMemo(
    () => Array.from(collectLevels(tree).values()).sort((a, b) => a.levelNo - b.levelNo),
    [tree]
  );

  const setTreeExpansion = (expanded: boolean) => {
    setExpandNodes(expanded);
    setExpansionSignal((previous) => previous + 1);
  };

  const onClose = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("showHierarchyTree");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  useEffect(() => {
    if (!isOpen || loaded) return;
    let isMounted = true;
    fetchGeographyUnitHierarchyTreeAction()
      .then((data) => {
        if (!isMounted) return;
        setTree(data);
      })
      .finally(() => {
        if (isMounted) setLoaded(true);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen, loaded]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={t("title")}
      subtitle={t("subtitle")}
      maxWidth="2xl"
      footer={<OkButton onClick={onClose} />}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-9 h-9 text-slate-400 animate-spin" />
          <p className="mt-3 text-sm text-slate-500">{t("loading")}</p>
        </div>
      ) : tree.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Network className="w-12 h-12 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">{t("empty")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
              {levelLegend.map((level) => (
                <span key={level.levelNo} className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-sm", getLevelColor(level.levelNo).dot)} />
                  <span>{level.geographyType}</span>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="xs"
                icon={SquarePlus}
                onClick={() => setTreeExpansion(true)}
              >
                {t("expandAll")}
              </Button>
              <Button
                variant="secondary"
                size="xs"
                icon={SquareMinus}
                onClick={() => setTreeExpansion(false)}
              >
                {t("collapseAll")}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <Network size={14} className="text-slate-500" />
            {t("administrativeUnits")}
          </div>

          <div className="max-h-[58vh] overflow-auto p-3 sm:p-5">
            {tree.map((node) => (
              <GeographyHierarchyTreeNode
                key={`${node.id}-${expansionSignal}`}
                node={node}
                defaultExpanded={expandNodes}
              />
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
