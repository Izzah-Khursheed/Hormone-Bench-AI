import { NextRequest, NextResponse } from "next/server";

const TARGET_BASE_URL =
  process.env.BACKEND_API_URL || "https://hormone-bench-ai-1.onrender.com";

async function proxyRequest(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path ? resolvedParams.path.join("/") : "";
  const searchParams = request.nextUrl.search;
  const targetUrl = `${TARGET_BASE_URL}/${path}${searchParams}`;

  const requestHeaders = new Headers();
  request.headers.forEach((value, key) => {
    // Exclude headers that can break proxying
    if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
      requestHeaders.set(key, value);
    }
  });

  let body: any = null;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body: body && body.byteLength > 0 ? body : undefined,
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // Exclude encoding and length headers that Next.js recalculates
      if (!["content-encoding", "transfer-encoding", "content-length"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    // Add CORS headers just in case
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "*");

    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    return NextResponse.json(
      { detail: `Proxy Error: ${err.message || "Failed to connect to backend"}` },
      { status: 502 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  });
}
