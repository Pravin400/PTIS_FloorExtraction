import { Suspense } from "react";

import { PageContainer } from "@/components/common/PageContainer";
import { FloorMasterHeader } from "@/components/modules/property-tax/Floormaster/FloorMasterHeader";

interface FloorMasterLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

function FloorMasterLayoutContent({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PageContainer>
      <div className="">
        <FloorMasterHeader />

        <div className="mt-2">
          {children}
        </div>
      </div>
    </PageContainer>
  );
}

export default async function FloorMasterLayout({
  children,
  params,
}: Readonly<FloorMasterLayoutProps>) {
  await params;

  return (
    <Suspense
      fallback={
        <div
          className="flex items-center justify-center p-6"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
        </div>
      }
    >
      <FloorMasterLayoutContent>
        {children}
      </FloorMasterLayoutContent>
    </Suspense>
  );
}
