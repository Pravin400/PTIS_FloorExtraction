import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppConfig } from "@/config/app.config";
import { serverFetch } from "@/lib/utils/server-fetch";

export async function GET(_request: NextRequest) {
  try {
    const baseUrl = getAppConfig().api.baseUrl?.replace(/\/$/, "");
    if (!baseUrl) {
      return new NextResponse("API base URL is not configured", { status: 500 });
    }

    const cookieStore = await cookies();
    const headers: Record<string, string> = {
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };

    const token = cookieStore.get("auth_token")?.value;
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const csrf = cookieStore.get("csrf_token")?.value;
    if (csrf) headers["X-CSRF-Token"] = csrf;

    const cookieStr = cookieStore
      .getAll()
      .filter((c) => /auth_token|refresh_token|session_id|csrf_token|\.AspNetCore\.Antiforgery/.test(c.name))
      .map((c) => `${c.name.replace(/[^\x00-\x7F]/g, "")}=${c.value.replace(/[^\x00-\x7F]/g, "")}`)
      .join("; ");
    if (cookieStr) headers["Cookie"] = cookieStr;

    const backendResponse = await serverFetch(`${baseUrl}/tax-zoning-ranges/bulk-template`, {
      method: "GET",
      headers,
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      return new NextResponse(errorText || "Template generation failed", { status: backendResponse.status });
    }

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    responseHeaders.set("Content-Disposition", 'attachment; filename="Tax_Zoning_Bulk_Update_Template.xlsx"');
    responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");

    const contentLength = backendResponse.headers.get("Content-Length");
    if (contentLength) responseHeaders.set("Content-Length", contentLength);

    return new Response(backendResponse.body, { status: 200, headers: responseHeaders });
  } catch (error) {
    console.error("Failed to download bulk template:", error);
    return new NextResponse("Template generation failed", { status: 500 });
  }
}
