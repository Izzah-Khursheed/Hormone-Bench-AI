export const RAW_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://hormone-bench-ai-1.onrender.com";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
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
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = await response.text();
      }

      let message = `API request failed with status ${response.status}`;
      if (typeof errorData === "object" && errorData !== null) {
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            message = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join("; ");
          } else if (typeof errorData.detail === "string") {
            message = errorData.detail;
          }
        } else if (errorData.message) {
          message = errorData.message;
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
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new ApiError("Request timed out. Render backend might be starting up.", 504);
    }
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || "Network request failed", 500);
  }
}
