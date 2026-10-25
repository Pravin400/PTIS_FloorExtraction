"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { FireAuditFooter } from "./FireAuditFooter";
import { FireAuditHeader } from "./FireAuditHeader";
import { FireAuditMobileNav } from "./FireAuditMobileNav";
import { FireAuditSidebar } from "./FireAuditSidebar";

import { SurveyorShell } from "../surveyor/shared";

/**
 * Fire Audit workspace from the static demo: navy sidebar, white title bar, paper footer.
 */
export function FireAuditShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const [navOpen, setNavOpen] = useState(false);

  // [SURVEYOR SHELL] Dedicated tactile field inspection chrome for surveyor
  if (pathname.includes("/fire-audit/surveyor")) {
    return <SurveyorShell>{children}</SurveyorShell>;
  }

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-[#F5F7F8] text-[#153746]">
      <FireAuditSidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <FireAuditHeader onOpenNav={() => setNavOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        <FireAuditFooter />
        <FireAuditMobileNav />
      </div>
    </div>
  );
}
