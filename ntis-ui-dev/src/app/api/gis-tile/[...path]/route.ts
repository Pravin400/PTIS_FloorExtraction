import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppConfig } from "@/config/app.config";
import { serverFetch } from "@/lib/utils/server-fetch";

import { validatePathSegments } from "@/lib/utils/validate-path-segments";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const resolvedParams = await params;
        const pathSegments = resolvedParams.path || [];
        const { isValid, sanitizedPath } = validatePathSegments(pathSegments);

        if (!isValid || !sanitizedPath) {
            return new NextResponse("Forbidden: Invalid or unsafe path segment", { status: 400 });
        }

        const pathStr = sanitizedPath;

        const config = getAppConfig();
        const baseUrl = config.api.baseUrl?.trim();
        if (!baseUrl) {
            return new NextResponse("Backend API base URL is not configured", { status: 500 });
        }

        // Build backend URL: {baseUrl}/GisTile/{pathStr}?{searchParams}
        const searchParams = request.nextUrl.searchParams.toString();
        const separator = baseUrl.endsWith("/") ? "" : "/";
        const targetUrl = `${baseUrl}${separator}GisTile/${pathStr}${searchParams ? `?${searchParams}` : ""}`;

        // Get auth token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        const headers: Record<string, string> = {
            "Accept": "*/*",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await serverFetch(targetUrl, {
            method: "GET",
            headers
        });

        if (!response.ok) {
            // Important: We MUST consume the response body to prevent undici memory leaks
            // when returning a custom error response, especially for high-volume 404s.
            await response.text().catch(() => {});
            
            if (response.status === 404) {
                return new NextResponse(null, { status: 204 });
            }

            return new NextResponse(
                `Backend responded with status ${response.status}`,
                { status: response.status }
            );
        }

        const responseHeaders = new Headers();
        responseHeaders.set("Cache-Control", "no-store");

        const contentType = response.headers.get("content-type");
        if (contentType) responseHeaders.set("Content-Type", contentType);

        // A 204/205/304 response must never carry a body — the Response constructor
        // throws "Invalid response status code" if given one, even an empty ArrayBuffer.
        // Most tiles legitimately have no intersecting features and return 204, so this
        // fires constantly if not special-cased.
        if (response.status === 204 || response.status === 205 || response.status === 304) {
            return new NextResponse(null, { status: response.status, headers: responseHeaders });
        }

        // Buffer the fully-decoded body instead of streaming response.body directly:
        // arrayBuffer() always returns the decompressed bytes regardless of the upstream
        // Content-Encoding, and NextResponse computes a correct Content-Length from it —
        // avoiding any risk of forwarding a stale/compressed length alongside a decoded body.
        const bodyBuffer = await response.arrayBuffer();
        return new NextResponse(bodyBuffer, {
            status: response.status,
            headers: responseHeaders
        });
    } catch (error) {
        console.error("Error in GisTile proxy route:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
