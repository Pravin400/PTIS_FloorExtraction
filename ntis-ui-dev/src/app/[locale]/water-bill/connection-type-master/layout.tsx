import { PageContainer } from "@/components/common/PageContainer";
import { WaterConnectionHeader } from "@/components/modules/water-bill/connection-type-master";

interface LayoutProps {
  children: React.ReactNode;
}

export default function ConnectionTypeMasterLayout({
  children,
}: Readonly<LayoutProps>) {
  return (
    <PageContainer>
      <div className="w-full flex flex-col gap-4">
        <WaterConnectionHeader />
        <div className="w-full">{children}</div>
      </div>
    </PageContainer>
  );
}
