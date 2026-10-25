import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAppConfig } from "@/config/app.config";

const ALLOWED_TYPES = {
  "ward-abstract-excel": {
    path: "/tax-zoning-ranges/ward-abstract/export-excel",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: "xlsx",
    prefix: "Ward_Abstract",
  },
"ranges-excel": {
    path: "/tax-zoning-ranges/export-excel",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: "xlsx",
    prefix: "TaxZoningRanges",
  },
  "pending-excel": {
    path: "/tax-zoning-ranges/pending/export-excel",
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ext: "xlsx",
    prefix: "PendingTaxZoning",
  },
} as const;

type ExportType = keyof typeof ALLOWED_TYPES;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") as ExportType | null;

  if (!type || !(type in ALLOWED_TYPES)) {
    return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getAppConfig();
  const { path, contentType, ext, prefix } = ALLOWED_TYPES[type];

  // Locale drives the Accept-Language header below (read by the backend's LanguageMiddleware)
  // rather than being forwarded as a query param.
  const locale = searchParams.get("locale") || "en";

  // Forward all other query params to the backend (SearchTerm, etc.)
  const forwardParams = new URLSearchParams();
  searchParams.forEach((value, key) => {
    if (key !== "type" && key !== "locale") forwardParams.set(key, value);
  });

  // Inject ulbName from cookie if not already supplied by the client
  // Prefer ulb_name_local (Marathi), then ulb_name (English), then ulb_code
  if (!forwardParams.has("ulbName")) {
    const rawLocal = cookieStore.get("ulb_name_local")?.value;
    const rawName = cookieStore.get("ulb_name")?.value;
    const rawCode = cookieStore.get("ulb_code")?.value;
    const rawUlbName = rawLocal || rawName || rawCode || "";
    if (rawUlbName) {
      try {
        const decoded = decodeURIComponent(rawUlbName.replace(/\+/g, " "));
        if (decoded) forwardParams.set("ulbName", decoded);
      } catch {
        forwardParams.set("ulbName", rawUlbName);
      }
    }
  }

  const backendUrl = `${config.api.baseUrl}${path}${forwardParams.size ? `?${forwardParams}` : ""}`;

  let backendRes: Response;
  try {
    backendRes = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: contentType,
        "Accept-Language": locale,
      },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ error: "Backend unreachable" }, { status: 502 });
  }

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: `Export failed (${backendRes.status})` },
      { status: backendRes.status }
    );
  }

  const bytes = await backendRes.arrayBuffer();

  // The backend builds the filename from Core.ULBMaster (it is the authoritative
  // source for the ULB name), so forward its Content-Disposition filename verbatim.
  // Only fall back to a locally-built name if that header is missing.
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const backendDisposition = backendRes.headers.get("content-disposition") ?? "";
  const backendName =
    /filename\*=UTF-8''([^;]+)/i.exec(backendDisposition)?.[1] ??
    /filename="?([^";]+)"?/i.exec(backendDisposition)?.[1] ??
    "";
  const filename = backendName
    ? decodeURIComponent(backendName.trim())
    : `${prefix}_${stamp}.${ext}`;

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(bytes.byteLength),
    },
  });
}
