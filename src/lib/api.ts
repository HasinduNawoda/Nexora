const API_URL = import.meta.env.VITE_API_URL;

let authToken: string | null = localStorage.getItem("nexora_token");

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem("nexora_token", token);
  else localStorage.removeItem("nexora_token");
}

export function getAuthToken() {
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    // Session expired or invalid — clear the stale token and send the
    // admin back to login instead of letting every write fail silently.
    const hadToken = !!authToken;
    setAuthToken(null);
    if (hadToken && !window.location.pathname.startsWith("/admin/login")) {
      window.location.href = "/admin/login";
    }
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return undefined as T;
}

async function upload(path: string, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
  // Note: no Content-Type header here — the browser sets
  // multipart/form-data with the correct boundary itself.

  const res = await fetch(`${API_URL}${path}`, { method: "POST", body: formData, headers });

  if (res.status === 401 || res.status === 403) {
    const hadToken = !!authToken;
    setAuthToken(null);
    if (hadToken && !window.location.pathname.startsWith("/admin/login")) {
      window.location.href = "/admin/login";
    }
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Upload failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
  upload,
};