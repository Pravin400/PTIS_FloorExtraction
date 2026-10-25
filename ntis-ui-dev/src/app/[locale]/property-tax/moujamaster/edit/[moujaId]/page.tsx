import MoujaForm from "@/components/modules/property-tax/mouja-master/MoujaForm";
import { getMoujaByIdAction } from "../../action";
import { notFound } from "next/navigation";
import React from "react";
import type { Mouja } from "@/types/mouja.types";
import { ApiError } from "@/lib/utils/api";
import { logger } from "@/lib/utils/logger";

interface PageProps {
  params: Promise<{
    moujaId: string;
  }>;
}

export default async function EditPage({ params }: PageProps): Promise<React.ReactElement> {
  const { moujaId: moujaIdParam } = await params;

  // Parse and validate the ID (Next.js route params are always strings)
  const moujaId = Number(moujaIdParam);
  if (!Number.isFinite(moujaId) || moujaId <= 0) {
    notFound();
  }

  // Fetch data server-side
  let moujaData: Mouja;
  try {
    moujaData = await getMoujaByIdAction(moujaId);
  } catch (error) {
    // Only map a genuine 404 to Next.js's notFound().
    // Other failures (auth, timeout, server error) rethrow so error.tsx
    // can display a meaningful message instead of a misleading 404 page.
    if (error instanceof ApiError && error.statusCode === 404) {
      notFound();
    }
    logger.error("Failed to fetch mouja", { error: error as Error });
    // Rethrow — Next.js will catch this and render the nearest error.tsx
    throw error;
  }

  return (
    <>
      <MoujaForm
        id={moujaId}
        initialData={moujaData}
      />
    </>
  );
}
