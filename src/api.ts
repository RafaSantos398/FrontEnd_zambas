export const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8080"
).replace(/\/$/, "")

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function errorMessage(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) return value
  if (!value || typeof value !== "object") return fallback
  const record = value as Record<string, unknown>
  for (const key of ["detail", "mensagem", "message"]) {
    if (typeof record[key] === "string" && record[key]) return record[key]
  }
  if (Array.isArray(record.errors)) return record.errors.map(String).join(" ")
  if (record.errors && typeof record.errors === "object") {
    return Object.values(record.errors as Record<string, unknown>)
      .map(String)
      .join(" ")
  }
  return fallback
}

export async function api<T>(
  path: string,
  options: {
    method?: string
    token?: string | null
    body?: unknown
    signal?: AbortSignal
  } = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error
    throw new ApiError(
      `Não foi possível acessar a API em ${API_URL}. Verifique se o backend está disponível e se CORS permite esta origem.`,
      0,
      error,
    )
  }

  const contentType = response.headers.get("content-type") || ""
  const hasBody =
    response.status !== 204 && response.headers.get("content-length") !== "0"
  let data: unknown = null
  if (hasBody) {
    data = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text()
  }
  if (!response.ok)
    throw new ApiError(
      errorMessage(data, `A API respondeu com o status ${response.status}.`),
      response.status,
      data,
    )
  return data as T
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado."
}
