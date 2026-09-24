const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://8v5uo86qvg.execute-api.ca-central-1.amazonaws.com/dev";

const CONTACT_SEARCH_PATH = import.meta.env.VITE_CONTACT_SEARCH_PATH ?? "/contact-search";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Single place to attach auth once a scheme is chosen (API key header,
 * Cognito bearer token, SigV4 signing, etc). Currently unauthenticated.
 */
function buildAuthHeaders(): HeadersInit {
  const apiKey = import.meta.env.VITE_API_KEY;
  return apiKey ? { "x-api-key": apiKey } : {};
}

type QueryParams = Record<string, string | number | undefined>;

export async function apiGet<T>(path: string, params: QueryParams = {}): Promise<T> {
  const url = new URL(API_BASE_URL.replace(/\/$/, "") + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...buildAuthHeaders(),
      },
    });
  } catch {
    throw new ApiError("Could not reach the API. Check your network connection and the API base URL.", 0);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new ApiError(`Request failed (${response.status}): ${body || response.statusText}`, response.status);
  }

  return (await response.json()) as T;
}

export { API_BASE_URL, CONTACT_SEARCH_PATH };
