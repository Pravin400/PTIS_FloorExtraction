import React from "react";
import { notFound } from "next/navigation";
import { TypeOfUseMaster } from "@/components/modules/assets/configuration/master-data/type-of-use-master/TypeOfUseMaster";
import { getTypeOfUseDashboardProps } from "../../../action";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
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

export default async function Page({ params, searchParams }: PageProps): Promise<React.ReactElement> {
  const { id: rawId } = await params;
  if (!/^\d+$/.test(rawId)) notFound();
  const id = Number(rawId);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();
  const search = await searchParams;

  const props = await getTypeOfUseDashboardProps("editType", id, search);

  return <TypeOfUseMaster {...props} />;
}
