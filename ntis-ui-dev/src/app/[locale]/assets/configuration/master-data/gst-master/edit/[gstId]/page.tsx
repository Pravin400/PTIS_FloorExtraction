import React from "react";
import GstMasterForm from "@/components/modules/assets/configuration/master-data/gst-master/GstMasterForm";
import { getGstMasterByIdAction } from "../../action";
import { notFound } from "next/navigation";
import { ApiError } from "@/lib/utils/api";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger("gst-master/edit");

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    gstId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { gstId: gstIdParam } = await params;

  const gstId = Number(gstIdParam);
  if (!Number.isFinite(gstId) || gstId <= 0) {
    notFound();
  }

  let gstData = null;
  try {
    gstData = await getGstMasterByIdAction(gstId);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to load details for editing", { error });
    throw error;
  }

  return <GstMasterForm id={gstId} initialData={gstData} />;
}

