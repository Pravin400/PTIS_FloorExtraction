/**
 * Zone and Ward type guards / normalizers.
 */

import { ApiError } from "@/lib/utils/api";
import type {
  WardApiResponse,
  ZoneApiResponse,
} from "@/types/property-search";

function resolveZoneId(data: Record<string, unknown>): number {
  const raw = data.id ?? data.zoneId;
  return Number(raw);
}

export function isZoneShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const zoneId = resolveZoneId(obj);
  return Number.isFinite(zoneId) && zoneId > 0;
}

export function normalizeZone(data: Record<string, unknown>): ZoneApiResponse {
  const zoneId = resolveZoneId(data);
  if (!Number.isFinite(zoneId) || zoneId <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid zone id: ${String(data.id ?? data.zoneId)}`
    );
  }

  const zoneNo = String(data.zoneNo ?? "").trim();
  if (!zoneNo) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: zoneNo"
    );
  }

  return {
    zoneId,
    zoneNo,
    description: data.description != null ? String(data.description).trim() : null,
    sequenceNo: data.sequenceNo != null ? Number(data.sequenceNo) : null,
    isActive: Boolean(data.isActive ?? true),
  };
}

function resolveWardId(data: Record<string, unknown>): number {
  const raw = data.id ?? data.wardId;
  return Number(raw);
}

export function isWardShape(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  const wardId = resolveWardId(obj);
  const zoneId = Number(obj.zoneId);
  return (
    Number.isFinite(wardId) && wardId > 0 && Number.isFinite(zoneId) && zoneId > 0
  );
}

export function normalizeWard(data: Record<string, unknown>): WardApiResponse {
  const wardId = resolveWardId(data);
  if (!Number.isFinite(wardId) || wardId <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid ward id: ${String(data.id ?? data.wardId)}`
    );
  }

  const zoneId = Number(data.zoneId);
  if (!Number.isFinite(zoneId) || zoneId <= 0) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      `Invalid zoneId: ${data.zoneId}`
    );
  }

  const wardNo = String(data.wardNo ?? "").trim();
  if (!wardNo) {
    throw new ApiError(
      500,
      "Invalid data received from server",
      "Missing required field: wardNo"
    );
  }

  return {
    wardId,
    wardNo,
    zoneId,
    description: data.description != null ? String(data.description).trim() : null,
    sequenceNo: data.sequenceNo != null ? Number(data.sequenceNo) : null,
    isActive: Boolean(data.isActive ?? true),
  };
}
