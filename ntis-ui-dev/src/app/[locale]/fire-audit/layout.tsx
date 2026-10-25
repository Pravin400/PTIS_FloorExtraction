"use client";

import { usePathname } from "next/navigation";
import { FireAuditShell } from "@/components/modules/fire-audit/shared/FireAuditShell";

/**
 * Every Fire Audit screen uses the demo workspace chrome.
 * Login and Register screens display only the popup/card page without the workspace shell (sidebar & header).
 * The shared FireAuditShell component remains untouched and active for all other fire-audit routes.
 */
export default function FireAuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";

  const isAuthRoute =
    pathname.includes("/fire-audit/login") ||
    pathname.includes("/fire-audit/register");

  if (isAuthRoute) {
    return (
      <div className="flex min-h-dvh w-screen items-center justify-center bg-[#F5F7F8] p-4">
        {children}
      </div>
    );
  }

  return <FireAuditShell>{children}</FireAuditShell>;
}
