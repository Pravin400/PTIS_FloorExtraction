import React from "react";
import { TypeOfUseMaster } from "@/components/modules/assets/configuration/master-data/type-of-use-master/TypeOfUseMaster";
import { getTypeOfUseDashboardProps } from "./action";

interface PageProps {
  searchParams: Promise<{
    selectedGroupId?: string;
    selectedTypeOfUseId?: string;
    groupPn?: string;
    groupPs?: string;
    groupSearch?: string;
    groupSortBy?: string;
    groupSortOrder?: string;
    typePn?: string;
    typePs?: string;
    typeSearch?: string;
    typeSortBy?: string;
    typeSortOrder?: string;
    subTypePn?: string;
    subTypePs?: string;
    subTypeSearch?: string;
    subTypeSortBy?: string;
    subTypeSortOrder?: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: PageProps): Promise<React.ReactElement> {
  const search = await searchParams;
  const props = await getTypeOfUseDashboardProps(undefined, null, search);

  return <TypeOfUseMaster {...props} />;
}
