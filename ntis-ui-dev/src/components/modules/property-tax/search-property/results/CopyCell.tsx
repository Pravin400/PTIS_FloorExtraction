"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/common";
import type { CopyCellProps } from "@/types/property-search";

export function CopyCell({ value, label }: CopyCellProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      onClick={handleCopy}
      className="group relative !h-auto !px-0 !py-0 font-normal cursor-pointer"
      aria-label={`Copy ${label}`}
    >
      <span className="text-blue-600 font-medium hover:underline break-words whitespace-normal text-left">
        {value}
      </span>
      <Copy className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Button>
  );
}
