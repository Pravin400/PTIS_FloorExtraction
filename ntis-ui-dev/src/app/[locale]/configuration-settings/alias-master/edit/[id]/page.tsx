import React from "react";
import { notFound } from "next/navigation";
import AliasMasterForm from "@/components/modules/configuration-settings/alias-master/AliasMasterForm";
import { getAliasMasterByIdAction } from "../../action";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: EditPageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    notFound();
  }

  const result = await getAliasMasterByIdAction(numericId).catch(() => null);
  if (!result) {
    notFound();
  }

  return <AliasMasterForm id={numericId} initialData={result} />;
}
