"use client";

import { useEffect } from "react";

interface UseAllocationUrlSyncProps {
  open: boolean;
  currentStep: 1 | 2 | 3;
  activeWardZoneId: number | null;
}

export function updateAllocationUrlParams(step: 1 | 2 | 3, zoneId?: number | null) {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(step));
    if (step === 2 && zoneId && Number(zoneId) > 0) {
      url.searchParams.set("zoneId", String(zoneId));
    } else {
      url.searchParams.delete("zoneId");
    }
    const newQuery = url.searchParams.toString();
    const newUrl = newQuery ? `${url.pathname}?${newQuery}` : url.pathname;
    window.history.replaceState(null, "", newUrl);
  } catch {
    // ignore
  }
}

export function useAllocationUrlSync({
  open,
  currentStep,
  activeWardZoneId,
}: UseAllocationUrlSyncProps) {

  // Ensure query param is synced when drawer opens if not already present
  useEffect(() => {
    if (open && typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (!url.searchParams.has("step")) {
          url.searchParams.set("step", String(currentStep));
          if (currentStep === 2 && activeWardZoneId && Number(activeWardZoneId) > 0) {
            url.searchParams.set("zoneId", String(activeWardZoneId));
          }
          const newQuery = url.searchParams.toString();
          const newUrl = newQuery ? `${url.pathname}?${newQuery}` : url.pathname;
          window.history.replaceState(null, "", newUrl);
        }
      } catch {
        // ignore
      }
    }
  }, [open, currentStep, activeWardZoneId]);

  // Clean up URL query params when drawer closes
  useEffect(() => {
    if (!open && typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has("step") || url.searchParams.has("zoneId")) {
          url.searchParams.delete("step");
          url.searchParams.delete("zoneId");
          const newQuery = url.searchParams.toString();
          const newUrl = newQuery ? `${url.pathname}?${newQuery}` : url.pathname;
          window.history.replaceState(null, "", newUrl);
        }
      } catch {
        // ignore
      }
    }
  }, [open]);

  return {
    updateUrlParams: updateAllocationUrlParams,
  };
}
