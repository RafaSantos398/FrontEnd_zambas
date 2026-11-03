import { useCallback, useEffect, useState } from "react"

import { api, ApiError, getErrorMessage } from "./api"

import { Button, Notice, Spinner, StatusBadge } from "./components"

import { labels } from "./types"

const sections = {
  institutions: {
    title: "Instituições",

    singular: "instituição",

    path: "/instituicoes",
  },

  courses: { title: "Cursos", singular: "curso", path: "/cursos" },

  areas: {
    title: "Áreas de estudo",

    singular: "área de estudo",

    path: "/area-estudo",
  },

  templates: {
    title: "Modelos de tarefa",

    singular: "modelo de tarefa",

    path: "/modelos-tarefa",
  },
}

export default function AdminPage({ token, onUnauthorized }) {
  const [section, setSection] = useState("institutions")

  const [catalogs, setCatalogs] = useState({
    institutions: [],

    courses: [],

    areas: [],

    templates: [],
  })

  const [loading, setLoading] = useState(true)

  const [busy, setBusy] = useState(false)

  const [error, setError] = useState("")

  const [success, setSuccess] = useState("")

  const [editor, setEditor] = useState(null)

  const [associationCourse, setAssociationCourse] = useState(null)

  const [associated, setAssociated] = useState([])

  const config = sections[section]

  const handleError = useCallback(
    (failure) => {
      if (failure instanceof ApiError && failure.status === 401)
        onUnauthorized()
      else setError(getErrorMessage(failure))
    },

    [onUnauthorized],
  )

  const load = useCallback(async () => {
    setLoading(true)

    setError("")

    try {
      const keys = Object.keys(sections)

      const lists = await Promise.all(
        keys.map((key) => api(sections[key].path, { token })),
      )

      setCatalogs(
        Object.fromEntries(keys.map((key, index) => [key, key === "courses" ? lists[index].filter(item => !item.pessoal) : lists[index]])),
      )
    } catch (failure) {
      handleError(failure)
    } finally {
      setLoading(false)
    }
  }, [token, handleError])

  useEffect(() => {
    void load()
  }, [load])

  function changeSection(next) {
    setSection(next)

    setEditor(null)

    setAssociationCourse(null)

    setAssociated([])

    setError("")

    setSuccess("")
  }

  function openEditor(item = {}) {
    setEditor(item)

    setAssociationCourse(null)

    setError("")

    setSuccess("")
  }

  async function save(event) {
    event.preventDefault()

    if (busy) return

    const form = new FormData(event.currentTarget)

    const value = (name) => String(form.get(name) || "").trim()

    let body

    if (section === "templates") {
      body = {
        titulo: value("titulo"),

        descricao: value("descricao"),

        categoria: value("categoria"),
      }
    } else if (section === "courses") {
      body = {
        instituicaoId: Number(value("instituicaoId")),

        nome: value("nome"),

        descricao: value("descricao") || null,

        tipoIntercambio: value("tipoIntercambio"),

        idioma: value("idioma"),

        duracaoMeses: value("duracaoMeses")
          ? Number(value("duracaoMeses"))
          : null,
      }
    } else {
      body = { nome: value("nome"), descricao: value("descricao") || null }

      if (section === "institutions")
        body.siteOficial = value("siteOficial") || null
    }

    setBusy(true)

    setError("")

    setSuccess("")

    try {
      await api(config.path + (editor.id ? `/${editor.id}` : ""), {
        method: editor.id ? "PUT" : "POST",

        body,

        token,
      })

      setEditor(null)

      await load()

      setSuccess("Registro salvo com sucesso.")
    } catch (failure) {
      handleError(failure)
    } finally {
      setBusy(false)
    }
  }

  async function changeActive(item) {
    if (busy) return

    setBusy(true)

    setError("")

    setSuccess("")

    const path =
      section === "courses"
        ? `/cursos/${item.id}/${item.ativo ? "desativar" : "ativar"}`
        : `/modelos-tarefa/${item.id}`

    try {
      const updated = await api(path, { method: "PATCH", token })

      setCatalogs((current) => ({
        ...current,

        [section]: current[section].map((row) =>
          row.id === updated.id ? updated : row,
        ),
      }))

      setSuccess(updated.ativo ? "Curso ativado." : "Registro desativado.")
    } catch (failure) {
      handleError(failure)
    } finally {
      setBusy(false)
    }
  }

  async function openAssociations(course) {
    setBusy(true)

    setError("")

    setSuccess("")

    setEditor(null)

    setAssociationCourse(null)

    try {
      setAssociated(await api(`/cursos/${course.id}/modelos-tarefa`, { token }))

      setAssociationCourse(course)
    } catch (failure) {
      handleError(failure)
    } finally {
      setBusy(false)
    }
  }

  async function changeAssociation(modelId, method) {
    if (busy) return

    setBusy(true)

    setError("")

    setSuccess("")

    try {
      const updated = await api(
        `/cursos/${associationCourse.id}/modelos-tarefa/${modelId}`,

        { method, token },
      )

      setAssociated(updated)

      setSuccess(
        method === "POST"
          ? "Modelo associado ao curso."
          : "Associação removida.",
      )
    } catch (failure) {
      handleError(failure)
    } finally {
      setBusy(false)
    }
  }

  const available = catalogs.templates.filter(
    (model) => model.ativo && !associated.some((item) => item.id === model.id),
  )

  return (
    <section>
      <header className="page-heading">
        <div>
          <span className="eyebrow">Acesso de administrador</span>
          <h1>Administração</h1>
          <p>Catálogos que alimentam os planos e checklists.</p>
        </div>
      </header>
      {error && <Notice>{error}</Notice>}
      {success && <Notice kind="success">{success}</Notice>}
      <div className="admin-layout">
        <nav className="settings-nav" aria-label="Catálogos administrativos">
          {Object.entries(sections).map(([key, item]) => (
            <button
              key={key}
              className={section === key ? "active" : ""}
              onClick={() => changeSection(key)}
              disabled={busy}
            >
              {item.title}
            </button>
          ))}
        </nav>
        <div className="admin-content">
          <div className="panel admin-panel">
            <div className="section-heading">
              <div>
                <h2>{config.title}</h2>
                <p>Cadastre e mantenha os dados do catálogo.</p>
              </div>
              <div className="inline-actions">
                <Button
                  variant="secondary"
                  icon="refresh"
                  disabled={busy || loading}
                  onClick={() => void load()}
                >
                  Atualizar
                </Button>
                <Button
                  icon="plus"
                  disabled={busy || loading}
                  onClick={() => openEditor()}
                >
                  Cadastrar {config.singular}
                </Button>
              </div>
            </div>
            {loading ? (
              <Spinner />
            ) : !catalogs[section].length ? (
              !error && (
                <div className="table-empty">Nenhum registro cadastrado.</div>
              )
            ) : (
              <div className="admin-list">
                {catalogs[section].map((item) => (
                  <article key={item.id}>
                    <div>
                      <strong>{item.nome || item.titulo}</strong>
                      <p>{item.descricao || "Sem descrição."}</p>
                      {section === "courses" && (
                        <small>
                          {item.instituicaoNome} ·{" "}
                          {labels.exchange[item.tipoIntercambio]}
                        </small>
                      )}
                      {section === "templates" && (
                        <small>{labels.category[item.categoria]}</small>
                      )}
                    </div>
                    <div className="catalog-actions">
                      {"ativo" in item && (
                        <StatusBadge
                          label={item.ativo ? "Ativo" : "Desativado"}
                          status={item.ativo ? "CONCLUIDO" : "CANCELADO"}
                        />
                      )}
                      <Button
                        variant="secondary"
                        icon="edit"
                        disabled={busy}
                        onClick={() => openEditor(item)}
                      >
                        Editar
                      </Button>
                      {section === "courses" && (
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() => void openAssociations(item)}
                        >
                          Modelos do curso
                        </Button>
                      )}
                      {(section === "courses" ||
                        (section === "templates" && item.ativo)) && (
                        <Button
                          variant={item.ativo ? "ghost" : "secondary"}
                          disabled={busy}
                          onClick={() => void changeActive(item)}
                        >
                          {item.ativo ? "Desativar" : "Ativar"}
                        </Button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
          {editor && (
            <div
              className="panel admin-panel"
              key={`${section}-${editor.id || "new"}`}
            >
              <h2>
                {editor.id ? "Editar" : "Cadastrar"} {config.singular}
              </h2>
              <form className="form-grid two-cols catalog-form" onSubmit={save}>
                <label className="span-two">
                  {section === "templates" ? "Título" : "Nome"}
                  <input
                    name={section === "templates" ? "titulo" : "nome"}
                    required
                    maxLength={section === "templates" ? 200 : 100}
                    defaultValue={editor.nome || editor.titulo || ""}
                    autoFocus
                  />
                </label>
                <label className="span-two">
                  Descrição
                  <textarea
                    name="descricao"
                    rows={3}
                    maxLength={section === "templates" ? 400 : 500}
                    required={section === "templates"}
                    defaultValue={editor.descricao || ""}
                  />
                </label>
                {section === "institutions" && (
                  <label className="span-two">
                    Site oficial
                    <input
                      name="siteOficial"
                      type="url"
                      maxLength={500}
                      placeholder="https://universidade.exemplo"
                      defaultValue={editor.siteOficial || ""}
                    />
                  </label>
                )}
                {section === "templates" && (
                  <label>
                    Categoria
                    <select
                      name="categoria"
                      defaultValue={editor.categoria || "DOCUMENTACAO"}
                    >
                      {Object.entries(labels.category).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {section === "courses" && (
                  <>
                    <label>
                      Instituição
                      <select
                        name="instituicaoId"
                        required
                        defaultValue={editor.instituicaoId || ""}
                      >
                        <option value="">Selecione</option>
                        {catalogs.institutions.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nome}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Tipo de intercâmbio
                      <select
                        name="tipoIntercambio"
                        defaultValue={editor.tipoIntercambio || "CURSO_IDIOMA"}
                      >
                        {Object.entries(labels.exchange).map(
                          ([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <label>
                      Idioma
                      <input
                        name="idioma"
                        required
                        pattern="[A-Za-z]{2}(-[A-Za-z]{2})?"
                        placeholder="en ou pt-BR"
                        defaultValue={editor.idioma || ""}
                      />
                    </label>
                    <label>
                      Duração em meses
                      <input
                        name="duracaoMeses"
                        type="number"
                        min="1"
                        step="1"
                        defaultValue={editor.duracaoMeses || ""}
                      />
                    </label>
                  </>
                )}
                <div className="modal-actions span-two">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => setEditor(null)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={busy}>
                    {busy ? "Salvando…" : "Salvar registro"}
                  </Button>
                </div>
              </form>
            </div>
          )}
          {associationCourse && (
            <div className="panel admin-panel">
              <div className="section-heading">
                <div>
                  <h2>Modelos de {associationCourse.nome}</h2>
                  <p>
                    Modelos ativos que geram o checklist dos planos deste curso.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setAssociationCourse(null)}
                  disabled={busy}
                >
                  Fechar
                </Button>
              </div>
              {associated.length ? (
                <ul className="association-list">
                  {associated.map((model) => (
                    <li key={model.id}>
                      <span>{model.titulo}</span>
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                          void changeAssociation(model.id, "DELETE")
                        }
                      >
                        Remover associação
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum modelo ativo associado.</p>
              )}
              {available.length ? (
                <form
                  className="association-form"
                  onSubmit={(event) => {
                    event.preventDefault()

                    const id = new FormData(event.currentTarget).get("modeloId")

                    if (id) void changeAssociation(id, "POST")
                  }}
                >
                  <label>
                    Modelo de tarefa
                    <select name="modeloId" required defaultValue="">
                      <option value="">Selecione</option>
                      {available.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.titulo}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button type="submit" disabled={busy}>
                    Associar modelo
                  </Button>
                </form>
              ) : (
                <p className="field-help">
                  Não há outros modelos ativos disponíveis.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
