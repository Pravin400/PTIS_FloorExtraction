"use client";

import { usePathname } from "next/navigation";
import { locales } from "@/i18n/config";

/**
 * Custom hook to determine if the current page is an authentication or home-style page
 * that should not display the main application shell (sidebar, sidebar-header).
 */
export function useIsAuthPage(initialValue = false) {
  const pathname = usePathname();

  // If we don't have a pathname yet (server-side initial render), use the initial value
  if (!pathname) {
    return initialValue;
  }

  // Standardized logic for identifying "No-Shell" pages
  // We check the segment after the locale (e.g., /en/login -> login)
  const segments = pathname.split("/").filter(Boolean);


  // Case 1: Root path (e.g., / or /en or /mr)
  if (segments.length <= 1) {
    const lastSegment = segments[0] || "";
    const isLocaleOnly = locales.includes(lastSegment as typeof locales[number]) || lastSegment === "";
    return isLocaleOnly;
  }

  // Case 2: Specific auth/home segments

  const firstRealSegment = locales.includes(segments[0] as typeof locales[number])
    ? segments[1]
    : segments[0];

  // [GRIEVANCE & PORTAL BYPASS] Standalone citizen portals render without admin shell wrapper
  const noShellSegments = ["login", "home", "grievance", "fire-audit"];

  if (firstRealSegment === 'water-bill') {
    const secondSegment = locales.includes(segments[0] as typeof locales[number])
      ? segments[2]
      : segments[1];

    return secondSegment === 'portal';
  }

  return noShellSegments.includes(firstRealSegment);
}
