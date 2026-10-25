"use server";

import { cookies } from "next/headers";
import { authService } from "@/lib/api/auth.service";
import {
  createJurisdictionOverlay,
  listJurisdictionOverlays,
  updateJurisdictionOverlay,
  type JurisdictionOverlayWriteBody,
} from "@/lib/api/fire-audit/shared/jurisdiction-overlay.service";
import { ApiError } from "@/lib/utils/api";
import { getUserIdFromCookies } from "@/lib/utils/cookie";
import type { ActionResult } from "@/types/common.types";
import type { JurisdictionOverlayInput, JurisdictionOverlayRow } from "@/types/fire-audit/jurisdiction.types";

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function dateOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function signedInUlbId(): Promise<number | null> {
  const config = await authService.getUlbConfig();
  const ulbId = config.data?.ulbId;
  return ulbId != null && ulbId > 0 ? ulbId : null;
}

function toWriteBody(
  input: JurisdictionOverlayInput,
  ulbId: number | null,
  userId: number | null,
  mode: "create" | "update"
): JurisdictionOverlayWriteBody {
  const state = input.scope === "State";
  return {
    ulbId: input.scope === "ULB" ? ulbId : null,
    stateCode: state ? blankToNull(input.stateCode) : null,
    stateName: state ? blankToNull(input.stateName) : null,
    actTitle: blankToNull(input.actTitle),
    rulesTitle: blankToNull(input.rulesTitle),
    municipalActTitle: blankToNull(input.municipalActTitle),
    byeLawTitle: blankToNull(input.byeLawTitle),
    sectionRefs: blankToNull(input.sectionRefs),
    issuingAuthorityLabel: input.issuingAuthorityLabel.trim(),
    certificateFormCode: blankToNull(input.certificateFormCode),
    auditReportFormCode: blankToNull(input.auditReportFormCode),
    hasOwnFireBrigade: input.hasOwnFireBrigade,
    validityMonths: input.validityMonths,
    reminderOffsetsCsv: blankToNull(input.reminderOffsetsCsv),
    effectiveFrom: dateOrNull(input.effectiveFrom),
    effectiveTo: dateOrNull(input.effectiveTo),
    isActive: input.isActive,
    ...(mode === "create" ? { createdBy: userId } : { updatedBy: userId }),
  };
}

function failure(error: unknown, fallback: string): ActionResult<JurisdictionOverlayRow[]> {
  if (error instanceof ApiError) {
    if (error.statusCode === 401) {
      return { success: false, statusCode: 401, error: "session" };
    }
    return { success: false, statusCode: error.statusCode, error: error.error || fallback };
  }
  return { success: false, error: fallback };
}

export async function listJurisdictionOverlaysAction(): Promise<ActionResult<JurisdictionOverlayRow[]>> {
  try {
    const rows = await listJurisdictionOverlays();
    return { success: true, data: rows };
  } catch (error: unknown) {
    return failure(error, "load");
  }
}

export async function saveJurisdictionOverlayAction(
  input: JurisdictionOverlayInput
): Promise<ActionResult<JurisdictionOverlayRow[]>> {
  try {
    const cookieStore = await cookies();
    const userId = getUserIdFromCookies(cookieStore);
    const ulbId = input.scope === "ULB" ? await signedInUlbId() : null;
    if (input.scope === "ULB" && ulbId == null) {
      return { success: false, error: "council" };
    }

    const body = toWriteBody(input, ulbId, userId, input.id == null ? "create" : "update");
    if (input.id == null) {
      await createJurisdictionOverlay(body);
    } else {
      await updateJurisdictionOverlay(input.id, body);
    }

    const rows = await listJurisdictionOverlays();
    return { success: true, data: rows };
  } catch (error: unknown) {
    return failure(error, "save");
  }
}
