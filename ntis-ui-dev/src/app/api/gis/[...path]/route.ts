import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAppConfig } from "@/config/app.config";
import { serverFetch } from "@/lib/utils/server-fetch";
import { createLogger } from "@/lib/utils/server-logger";

const logger = createLogger('GisProxyRoute');

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

        // Build backend URL: {baseUrl}/gis/{pathStr}?{searchParams}
        const searchParams = request.nextUrl.searchParams.toString();
        const separator = baseUrl.endsWith("/") ? "" : "/";
        const qs = searchParams ? `?${searchParams}` : "";

        // Build candidate URLs (for vector tile endpoints, support both GeoJSON and MVT variants)
        const isTileRequest = pathStr.includes('tiles') || pathStr.endsWith('.mvt') || pathStr.endsWith('.geojson');
        const candidateUrls: string[] = [`${baseUrl}${separator}gis/${pathStr}${qs}`];
        if (isTileRequest) {
            if (pathStr.endsWith('.mvt')) {
                candidateUrls.push(`${baseUrl}${separator}gis/${pathStr.replace(/\.mvt$/, '.geojson')}${qs}`);
                candidateUrls.push(`${baseUrl}${separator}gis/${pathStr.replace(/\.mvt$/, '')}${qs}`);
            } else if (pathStr.endsWith('.geojson')) {
                candidateUrls.push(`${baseUrl}${separator}gis/${pathStr.replace(/\.geojson$/, '.mvt')}${qs}`);
                candidateUrls.push(`${baseUrl}${separator}gis/${pathStr.replace(/\.geojson$/, '')}${qs}`);
            }
        }

        // Get auth token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        const headers: Record<string, string> = {
            "Accept": request.headers.get("accept") || "application/geo+json, application/json, */*",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Forward cookies if available
        const cookieHeader = request.headers.get("cookie");
        if (cookieHeader) headers["Cookie"] = cookieHeader;

        let response: Response | null = null;
        let lastStatus = 404;
        let lastErrBody = '';

        for (const targetUrl of candidateUrls) {
            try {
                const res = await serverFetch(targetUrl, {
                    method: "GET",
                    headers
                });
                if (res.ok) {
                    response = res;
                    break;
                } else {
                    lastStatus = res.status;
                    lastErrBody = await res.text().catch(() => '');
                    if (res.status === 401 || res.status === 403) {
                        return new NextResponse(null, { status: res.status });
                    }
                }
            } catch {
                lastStatus = 502;
            }
        }

        if (!response || !response.ok) {
            if (isTileRequest && (lastStatus === 404 || lastStatus === 204)) {
                return new NextResponse(null, { status: 204 });
            }
            return new NextResponse(
                `Backend responded with status ${lastStatus}: ${lastErrBody}`,
                { status: lastStatus }
            );
        }

        const responseHeaders = new Headers();
        responseHeaders.set("Cache-Control", "private, no-store");

        const contentType = response.headers.get("content-type");
        if (contentType) responseHeaders.set("Content-Type", contentType);

        // A 204/205/304 response must never carry a body — the Response constructor
        // throws "Invalid response status code" if given one, even an empty ArrayBuffer.
        if (response.status === 204 || response.status === 205 || response.status === 304) {
            return new NextResponse(null, { status: response.status, headers: responseHeaders });
        }

        // Buffer the fully-decoded body instead of streaming response.body directly:
        // arrayBuffer() always returns the decompressed bytes regardless of the upstream
        // Content-Encoding, and NextResponse computes a correct Content-Length from it.
        const bodyBuffer = await response.arrayBuffer();
        return new NextResponse(bodyBuffer, {
            status: response.status,
            headers: responseHeaders
        });
    } catch (error) {
        logger.error("Error in gis proxy GET route:", { error: error as Error });
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}

export async function POST(
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

        const searchParams = request.nextUrl.searchParams.toString();
        const separator = baseUrl.endsWith("/") ? "" : "/";
        const targetUrl = `${baseUrl}${separator}gis/${pathStr}${searchParams ? `?${searchParams}` : ""}`;

        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        // Forward headers (except host, etc.)
        const headers: Record<string, string> = {};
        request.headers.forEach((value, key) => {
            if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
                headers[key] = value;
            }
        });

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Handle body forwarding
        const body = request.body ? request.body : undefined;

        const response = await serverFetch(targetUrl, {
            method: "POST",
            headers,
            body,
            // @ts-expect-error -- Next.js dynamic route params context
            duplex: "half"
        });

        if (!response.ok) {
            await response.text().catch(() => {});
            return new NextResponse(
                `Backend responded with status ${response.status}`,
                { status: response.status }
            );
        }

        const responseHeaders = new Headers();
        responseHeaders.set("Cache-Control", "no-store");
        
        response.headers.forEach((value, key) => {
            if (!['content-encoding', 'transfer-encoding'].includes(key.toLowerCase())) {
                responseHeaders.set(key, value);
            }
        });

        return new NextResponse(response.body, {
            status: response.status,
            headers: responseHeaders
        });
    } catch (error) {
        logger.error("Error in gis proxy POST route:", { error: error as Error });
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
