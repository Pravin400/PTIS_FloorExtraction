import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getAppConfig } from "@/config/app.config";
import { serverFetch } from "@/lib/utils/server-fetch";

/**
 * Route Handler for PropertyMedia/download/images.
 * Proxies image archive ZIP downloads from backend .NET API.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const photoTypeId = searchParams.get("PhotoTypeId") || searchParams.get("photoTypeId");
  const category = searchParams.get("Category") || searchParams.get("category");
  const toPropertyNo = searchParams.get("ToPropertyNo") || searchParams.get("toPropertyNo");
  const fromPropertyNo = searchParams.get("FromPropertyNo") || searchParams.get("fromPropertyNo");
  const wardIds = searchParams.get("WardIds") || searchParams.get("wardIds");
  const divisionId = searchParams.get("DivisionId") || searchParams.get("divisionId");

  if (!photoTypeId || !category) {
    return NextResponse.json(
      {
        success: false,
        message: "PhotoTypeId and Category are required parameters.",
      },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized: Authentication token is missing.",
      },
      { status: 401 }
    );
  }

  const config = getAppConfig();
  const baseUrl = config.api.baseUrl?.replace(/\/$/, "");
  if (!baseUrl) {
    return NextResponse.json(
      {
        success: false,
        message: "API base URL is not configured.",
      },
      { status: 500 }
    );
  }

  // Build backend query parameters
  const forwardParams = new URLSearchParams();
  forwardParams.set("PhotoTypeId", photoTypeId.trim());
  forwardParams.set("Category", category.trim());

  if (toPropertyNo && toPropertyNo.trim()) {
    forwardParams.set("ToPropertyNo", toPropertyNo.trim());
  }
  if (fromPropertyNo && fromPropertyNo.trim()) {
    forwardParams.set("FromPropertyNo", fromPropertyNo.trim());
  }
  if (wardIds && wardIds.trim()) {
    forwardParams.set("WardIds", wardIds.trim());
  }
  if (divisionId !== null && divisionId !== undefined && String(divisionId).trim()) {
    forwardParams.set("DivisionId", String(divisionId).trim());
  }

  const backendUrl = `${baseUrl}/PropertyMedia/download/images?${forwardParams.toString()}`;

  try {
    const backendRes = await serverFetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/zip, application/json, text/plain, */*",
      },
      cache: "no-store",
    });

    if (!backendRes.ok) {
      const contentType = backendRes.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const errorJson = await backendRes.json();
          return NextResponse.json(
            {
              success: false,
              message: errorJson.message || errorJson.Message || errorJson.error || "Image download request failed.",
              errors: errorJson.errors || null,
            },
            { status: backendRes.status }
          );
        } catch {
          // fallback to text if JSON parsing fails
        }
      }

      const errorText = await backendRes.text().catch(() => "");
      return NextResponse.json(
        {
          success: false,
          message: errorText || `Image download failed with status ${backendRes.status}`,
        },
        { status: backendRes.status }
      );
    }

    const contentType = backendRes.headers.get("content-type") || "application/zip";
    const backendDisposition = backendRes.headers.get("content-disposition") ?? "";

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const backendNameMatch =
      /filename\*=UTF-8''([^;]+)/i.exec(backendDisposition)?.[1] ??
      /filename="?([^";]+)"?/i.exec(backendDisposition)?.[1];

    const filename = backendNameMatch
      ? decodeURIComponent(backendNameMatch.trim())
      : `PropertyMedia_Images_${stamp}.zip`;

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
    console.error("Failed to download property media images:", error);
    return NextResponse.json(
      {
        success: false,
        message: (error as Error).message || "Download images service is currently unavailable.",
      },
      { status: 502 }
    );
  }
}
