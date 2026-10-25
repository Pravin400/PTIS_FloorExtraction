"use client";

import React from "react";
import { PageContainer } from "@/components/common/PageContainer";
import { RateTabsNavigation } from "@/components/modules/property-tax/RVRateMaster/RateTabsNavigation";

export default function RateMasterLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageContainer>
      <RateTabsNavigation />
      <div>
        {children}
      </div>
    </PageContainer>
  );
}
