export const API_URL = (
  import.meta.env?.VITE_API_URL || "http://localhost:8080"
)

  .replace(/\/+$/, "")

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)

    this.name = "ApiError"

    this.status = status

    this.details = details
  }
}

function errorMessage(value, fallback) {
  if (typeof value === "string") return value.trim() || fallback

  if (!value || typeof value !== "object") return fallback

  const fields =
    value.errors && typeof value.errors === "object"
      ? Object.values(value.errors).flat().map(String).join(" ")
      : ""

  const detail = [value.detail, value.mensagem, value.message].find(
    (item) => typeof item === "string" && item.trim(),
  )

  return [detail, fields].filter(Boolean).join(" ") || fallback
}

export async function api(path, options = {}) {
  let response

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method || "GET",

      headers: {
        Accept: "application/json, application/problem+json",

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
    if (error?.name === "AbortError") throw error

    throw new ApiError(
      "Não foi possível conectar ao servidor. Confira a conexão e tente novamente.",

      0,

      error,
    )
  }

  const text = response.status === 204 ? "" : await response.text()

  const contentType = (response.headers.get("content-type") || "").toLowerCase()

  let data = text || null

  if (text && contentType.includes("json")) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new ApiError(
        "O servidor enviou uma resposta inválida. Tente novamente.",

        response.status,
      )
    }
  } else if (contentType.includes("text/html")) {
    data = null
  }

  if (!response.ok) {
    const fallback =
      response.status === 401
        ? "Entre novamente para continuar."
        : response.status === 403
          ? "Você não tem permissão para esta ação."
          : `Não foi possível concluir a ação (${response.status}).`

    throw new ApiError(errorMessage(data, fallback), response.status, data)
  }

  return data
}

export function getErrorMessage(error) {
  return error instanceof Error ? error.message : "Ocorreu um erro inesperado."
}
