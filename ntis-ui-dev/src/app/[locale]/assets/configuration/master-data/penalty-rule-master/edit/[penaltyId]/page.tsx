import React from "react";
import PenaltyRuleMasterForm from "@/components/modules/assets/configuration/master-data/penalty-rule-master/PenaltyRuleMasterForm";
import { getPenaltyRuleByIdAction } from "../../action";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("penalty-rule-master/edit");

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    penaltyId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { penaltyId: penaltyIdParam } = await params;

  const penaltyId = Number(penaltyIdParam);
  if (!Number.isFinite(penaltyId) || penaltyId <= 0) {
    notFound();
  }

  let penaltyData = null;
  try {
    penaltyData = await getPenaltyRuleByIdAction(penaltyId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to load details for editing", { error });
    throw error;
  }

  return <PenaltyRuleMasterForm id={penaltyId} initialData={penaltyData} />;
}
