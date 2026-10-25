// Suspense removed as per requirement
import { getTranslations } from "next-intl/server";

import { PageContainer } from "@/components/common/PageContainer";
import TableHeader from "@/components/common/TableHeader";
import { WaterConnectionToolbar } from "@/components/modules/property-tax/WaterConnectionMaster/WaterConnectionToolbar";

async function WaterConnectionLayoutContent({
  children,
  locale,
}: Readonly<{ children: React.ReactNode; locale: string }>) {
  const t = await getTranslations({ locale, namespace: "waterConnectionMaster" });

  return (
    <PageContainer>
      <div>
        <TableHeader
          title={t("title")}
          subtitle={t("subtitle")}
          icon="database"
          rightContent={<WaterConnectionToolbar />}
        />
        <div className="mt-2">{children}</div>
      </div>
    </PageContainer>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function WaterConnectionMasterLayout({
  children,
  params,
}: Readonly<LayoutProps>) {
  const { locale } = await params;
  return (
    <WaterConnectionLayoutContent locale={locale}>
      {children}
    </WaterConnectionLayoutContent>
  );
}
