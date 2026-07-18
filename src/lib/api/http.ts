import "server-only";
import { getSession } from "@/lib/auth/session";

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function parseErrorBody(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // sin cuerpo JSON (ej. 401 sin handler específico)
  }

  if (body && typeof body === "object") {
    const record = body as Record<string, string>;
    if (typeof record.mensaje === "string") {
      return new ApiError(response.status, record.mensaje);
    }
    const [firstMessage] = Object.values(record);
    return new ApiError(response.status, firstMessage ?? "Ocurrió un error inesperado.", record);
  }

  return new ApiError(response.status, `Error ${response.status} al comunicarse con el servidor.`);
}

/** Server-only: adjunta el JWT de la sesión activa y llama al backend Spring Boot. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await getSession();
  const baseUrl = process.env.BACKEND_API_URL;

  if (!baseUrl) {
    throw new Error("BACKEND_API_URL no está configurada.");
  }

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseErrorBody(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/** Como apiFetch, pero para `multipart/form-data`: no fuerza Content-Type (fetch pone el boundary). */
export async function apiFetchMultipart<T>(path: string, formData: FormData): Promise<T> {
  const session = await getSession();
  const baseUrl = process.env.BACKEND_API_URL;

  if (!baseUrl) {
    throw new Error("BACKEND_API_URL no está configurada.");
  }

  const headers = new Headers();
  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers,
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseErrorBody(response);
  }

  return (await response.json()) as T;
}
