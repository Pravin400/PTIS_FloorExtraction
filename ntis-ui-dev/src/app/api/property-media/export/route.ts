import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAppConfig } from "@/config/app.config";
import { serverFetch } from "@/lib/utils/server-fetch";

const EXPORT_PATHS = {
  "detailed-coverage": "/PropertyMedia/detailed-coverage-list",
  "missing-properties": "/PropertyMedia/detailed-coverage/missing-properties",
  "audit-trail": "/PropertyMedia/jobs-History",
} as const;

type ExportType = keyof typeof EXPORT_PATHS;

// Validate which export the user requested.
// Authenticate using the server-side auth_token.
// Forward filters to the correct .NET export endpoint.
// Proxy the Excel/PDF binary back to the browser as a downloadable file.

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type") as ExportType | null;
  const format = searchParams.get("format") ?? "0";

  if (!type || !(type in EXPORT_PATHS)) {
    return NextResponse.json({ error: "Invalid or missing export type" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = getAppConfig();
  const baseUrl = config.api.baseUrl?.replace(/\/$/, "");
  if (!baseUrl) {
    return NextResponse.json({ error: "API base URL is not configured" }, { status: 500 });
  }

  const path = EXPORT_PATHS[type];

  // Forward query parameters
  const forwardParams = new URLSearchParams();
  forwardParams.set("format", format);

  searchParams.forEach((value, key) => {
    if (key !== "type" && key !== "locale" && key !== "format" && value.trim() !== "") {
      forwardParams.set(key, value.trim());
    }
  });

  const backendUrl = `${baseUrl}${path}?${forwardParams.toString()}`;

  const isExcel = format === "0";
  const expectedContentType = isExcel
    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    : "application/pdf";
  const ext = isExcel ? "xlsx" : "pdf";
  const defaultPrefix =
    type === "detailed-coverage"
      ? "PropertyMedia_DetailedCoverage"
      : type === "audit-trail"
      ? "PropertyMedia_AuditTrail"
      : "PropertyMedia_MissingProperties";

  try {
    const backendRes = await serverFetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: expectedContentType,
      },
      cache: "no-store",
    });

    if (!backendRes.ok) {
      const errorText = await backendRes.text().catch(() => "");
      return NextResponse.json(
        { error: errorText || `Export failed with status ${backendRes.status}` },
        { status: backendRes.status }
      );
    }

    const contentType = backendRes.headers.get("content-type") || expectedContentType;
    const backendDisposition = backendRes.headers.get("content-disposition") ?? "";

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const backendNameMatch =
      /filename\*=UTF-8''([^;]+)/i.exec(backendDisposition)?.[1] ??
      /filename="?([^";]+)"?/i.exec(backendDisposition)?.[1];

    const filename = backendNameMatch
      ? decodeURIComponent(backendNameMatch.trim())
      : `${defaultPrefix}_${stamp}.${ext}`;

    const bytes = await backendRes.arrayBuffer();

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (error) {
    console.error("Failed to export property media data:", error);
    return NextResponse.json({ error: "Export service unavailable" }, { status: 502 });
  }
}
