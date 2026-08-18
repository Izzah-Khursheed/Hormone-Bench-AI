export const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://hormone-bench-ai-1.onrender.com";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeoutMs = 60000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let url: string;
  if (endpoint.startsWith("http")) {
    url = endpoint;
  } else {
    const isBrowser = typeof window !== "undefined";
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

    if (isBrowser && !process.env.NEXT_PUBLIC_API_BASE_URL) {
      // Proxy through Next.js server route to bypass browser CORS completely
      url = `/api/backend${cleanEndpoint}`;
    } else {
      url = `${RAW_API_BASE_URL}${cleanEndpoint}`;
    }
  }

  const defaultHeaders: Record<string, string> = {};
  if (
    fetchOptions.body &&
    !(fetchOptions.body instanceof FormData) &&
    !fetchOptions.headers?.hasOwnProperty("Content-Type")
  ) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers: {
        ...defaultHeaders,
        ...(fetchOptions.headers as Record<string, string>),
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData: unknown;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      let message = `API request failed with status ${response.status}`;
      if (typeof errorData === "object" && errorData !== null) {
        const errObj = errorData as Record<string, unknown>;
        if (errObj.detail) {
          if (Array.isArray(errObj.detail)) {
            message = errObj.detail.map((err: unknown) => {
              if (typeof err === "object" && err !== null && "msg" in err) {
                return (err as { msg: string }).msg;
              }
              return JSON.stringify(err);
            }).join("; ");
          } else if (typeof errObj.detail === "string") {
            message = errObj.detail;
          }
        } else if (typeof errObj.message === "string") {
          message = errObj.message;
        }
      }

      throw new ApiError(message, response.status, errorData);
    }

    const textData = await response.text();
    try {
      return JSON.parse(textData) as T;
    } catch {
      return textData as unknown as T;
    }
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError("Request timed out. Render backend might be starting up.", 504);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    const msg = err instanceof Error ? err.message : "Network request failed";
    throw new ApiError(msg, 500);
  }
}
