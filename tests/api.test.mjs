import { test, afterEach } from "node:test"
import assert from "node:assert/strict"
import { api, ApiError } from "../src/api.js"
const originalFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = originalFetch
})

test("envia Bearer e JSON sem colocar credenciais em cookies", async () => {
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith("/planos-intercambio"))
    assert.equal(options.headers.Authorization, "Bearer teste")
    assert.equal(options.headers["Content-Type"], "application/json")
    assert.equal(options.credentials, undefined)
    assert.deepEqual(JSON.parse(options.body), { titulo: "Plano" })
    return Response.json({ id: 1 }, { status: 201 })
  }
  assert.deepEqual(
    await api("/planos-intercambio", {
      method: "POST",
      token: "teste",
      body: { titulo: "Plano" },
    }),
    { id: 1 },
  )
})

test("interpreta application/problem+json e preserva erros dos campos", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        detail: "Dados inválidos",
        errors: { nome: "Nome obrigatório" },
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/problem+json;charset=UTF-8" },
      },
    )
  await assert.rejects(
    api("/users"),
    (error) =>
      error instanceof ApiError &&
      error.status === 400 &&
      error.message.includes("Nome obrigatório") &&
      !error.message.startsWith("{"),
  )
})

test("aceita 204 sem tentar interpretar um corpo JSON", async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 })
  assert.equal(
    await api("/auth/logout", { method: "POST", token: "teste" }),
    null,
  )
})

test("não exibe páginas HTML como mensagem de erro", async () => {
  globalThis.fetch = async () =>
    new Response("<html>erro interno</html>", {
      status: 403,
      headers: { "Content-Type": "text/html" },
    })
  await assert.rejects(
    api("/users"),
    (error) =>
      error.status === 403 &&
      !error.message.includes("<html>") &&
      error.message.includes("permissão"),
  )
})

test("mantém 401 para o frontend invalidar o login", async () => {
  globalThis.fetch = async () => new Response(null, { status: 401 })
  await assert.rejects(
    api("/auth/me"),
    (error) => error instanceof ApiError && error.status === 401,
  )
})

test("preserva erros de texto dos controllers", async () => {
  globalThis.fetch = async () =>
    new Response("Nome não pode ficar vazio.", {
      status: 400,
      headers: { "Content-Type": "text/plain" },
    })
  await assert.rejects(api("/area-estudo"), {
    message: "Nome não pode ficar vazio.",
    status: 400,
  })
})

test("uma falha de rede é tratada como indisponibilidade", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed")
  }
  await assert.rejects(
    api("/cursos"),
    (error) => error instanceof ApiError && error.status === 0,
  )
})

test("cancelamento não vira mensagem de falha de conexão", async () => {
  globalThis.fetch = async () => {
    throw new DOMException("cancelado", "AbortError")
  }
  await assert.rejects(api("/cursos"), { name: "AbortError" })
})
