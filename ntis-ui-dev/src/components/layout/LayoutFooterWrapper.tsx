"use client";

import { usePathname } from "next/navigation";

export function LayoutFooterWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isPtisRoute = pathname.includes("/property-tax/ptis");

  if (isPtisRoute) return null;

  return <>{children}</>;
}
