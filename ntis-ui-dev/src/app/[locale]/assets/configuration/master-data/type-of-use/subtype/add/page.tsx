import React from "react";
import { TypeOfUseMaster } from "@/components/modules/assets/configuration/master-data/type-of-use-master/TypeOfUseMaster";
import { getTypeOfUseDashboardProps } from "../../action";

interface PageProps {
  searchParams: Promise<{
    selectedGroupId?: string;
    groupPn?: string;
    groupPs?: string;
    groupSearch?: string;
    groupSortBy?: string;
    groupSortOrder?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const search = await searchParams;
  const props = await getTypeOfUseDashboardProps("addSubtype", null, search);

  return <TypeOfUseMaster {...props} />;
}
