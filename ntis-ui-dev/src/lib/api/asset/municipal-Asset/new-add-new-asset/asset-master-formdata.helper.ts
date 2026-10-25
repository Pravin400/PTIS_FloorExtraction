 
import { cookies } from "next/headers";
import { serverFetch } from "@/lib/utils/server-fetch";
import { getAppConfig } from "@/config/app.config";
import type { ApiResponse } from "@/types/common.types";
import type { AssetMasterResponse } from "@/types/asset/municipal-Asset/new-add-new-asset/asset-wizard.types";

import type { FormDataLike, ApiErrorResponseShape } from "@/types/asset/municipal-Asset/new-add-new-asset";

export type { FormDataLike, ApiErrorResponseShape };

/** Type-guard that identifies a FormData instance via duck-typing (works across module boundaries). */
export function isFormData(data: FormData | FormDataLike | object | null | undefined): data is FormData {
  return (
    data instanceof FormData ||
    (data !== null &&
      typeof data === "object" &&
      "append" in data &&
      typeof (data as FormDataLike).append === "function" &&
      "entries" in data &&
      typeof (data as FormDataLike).entries === "function")
  );
}

/**
 * Rebuilds a FormData, reading each File entry's stream into a Blob so that
 * Node.js server actions can forward binary payloads to the upstream API.
 */
export async function rebuildSafeFormData(source: FormData): Promise<FormData> {
  const safe = new FormData();
  for (const [key, value] of source.entries()) {
    if (typeof value === "object" && value !== null && "stream" in value) {
      try {
        const file = value as File;
        const chunks: BlobPart[] = [];
        const reader = file.stream().getReader();
        while (true) {
          const { done, value: chunk } = await reader.read();
          if (done) break;
          if (chunk) chunks.push(chunk);
        }
        safe.append(key, new Blob(chunks, { type: file.type }), file.name || "upload.jpg");
      } catch {
        safe.append(key, value);
      }
    } else {
      safe.append(key, value);
    }
  }
  return safe;
}

/**
 * Extracts a human-readable error message from a JSON response body.
 * Falls back to the raw response text when the body is not JSON.
 */
export function extractErrorMessage(json: ApiErrorResponseShape | null | undefined, rawText: string): string {
  let message =
    json?.message ||
    json?.detail ||
    json?.title ||
    json?.error ||
    (rawText?.trim() ? rawText.trim() : "An error occurred");

  if (json?.errors && typeof json.errors === "object") {
    const firstKey = Object.keys(json.errors)[0];
    if (firstKey) {
      const firstErr = json.errors[firstKey];
      if (Array.isArray(firstErr) && firstErr.length > 0) message = String(firstErr[0]);
      else if (typeof firstErr === "string") message = firstErr;
    }
  }
  return message;
}

export async function getAuthHeadersForFormData(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const csrf = cookieStore.get("csrf_token")?.value;
  if (csrf) headers["X-CSRF-Token"] = csrf;
  const cookieStr = cookieStore
    .getAll()
    .filter((c) =>
      /auth_token|refresh_token|session_id|csrf_token|\.AspNetCore\.Antiforgery/.test(c.name)
    )
    .map((c) => `${c.name.replace(/[^\x00-\x7F]/g, "")}=${c.value.replace(/[^\x00-\x7F]/g, "")}`)
    .join("; ");
  if (cookieStr) headers["Cookie"] = cookieStr;
  return headers;
}

/**
 * Sends multipart/form-data to the upstream API for create or update operations.
 */
export async function sendAssetMasterFormData(
  path: string,
  method: "POST" | "PUT",
  data: FormData
): Promise<ApiResponse<AssetMasterResponse>> {
  const config = getAppConfig();
  const baseUrl = config.api.baseUrl?.trim();
  if (!baseUrl) {
    return { success: false, statusCode: 500, error: "API base URL is not configured" };
  }

  const url = `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = await getAuthHeadersForFormData();
  const safeFormData = await rebuildSafeFormData(data);

  const response = await serverFetch(url, { method, body: safeFormData, headers });
  const text = await response.text().catch(() => "");
  let json: (ApiErrorResponseShape & AssetMasterResponse) | undefined;
  try {
    json = text ? (JSON.parse(text) as ApiErrorResponseShape & AssetMasterResponse) : undefined;
  } catch {
    /* not JSON */
  }

  if (!response.ok) {
    return { success: false, statusCode: response.status, error: extractErrorMessage(json, text) };
  }
  return { success: true, statusCode: response.status, data: json as AssetMasterResponse };
}
