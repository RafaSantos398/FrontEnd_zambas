import { useCallback, useEffect, useState } from "react"
import { api, ApiError, getErrorMessage } from "./api"
import { Button, Notice, Spinner, StatusBadge } from "./components"
import type { Course, Institution, StudyArea, TaskTemplate } from "./types"
import { labels } from "./types"

interface Props {
  token: string
  onUnauthorized: () => void
}
type Section = "institutions" | "courses" | "areas" | "templates"

export default function AdminPage({ token, onUnauthorized }: Props) {
  const [section, setSection] = useState<Section>("institutions")
  const [data, setData] =
    useState<Institution[] | Course[] | StudyArea[] | TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    const path = {
      institutions: "/instituicoes",
      courses: "/cursos",
      areas: "/area-estudo",
      templates: "/modelos-tarefa",
    }[section]
    try {
      setData(
        await api<Institution[] | Course[] | StudyArea[] | TaskTemplate[]>(
          path,
          { token },
        ),
      )
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401)
        onUnauthorized()
      else setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [onUnauthorized, section, token])

  useEffect(() => {
    void load()
  }, [load])

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
      <div className="admin-layout">
        <nav className="settings-nav" aria-label="Catálogos administrativos">
          {([
            ["institutions", "Instituições"],
            ["courses", "Cursos"],
            ["areas", "Áreas de estudo"],
            ["templates", "Modelos de tarefa"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              className={section === value ? "active" : ""}
              onClick={() => setSection(value)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="panel admin-panel">
          <div className="section-heading">
            <div>
              <h2>
                {
                  {
                    institutions: "Instituições",
                    courses: "Cursos",
                    areas: "Áreas de estudo",
                    templates: "Modelos de tarefa",
                  }[section]
                }
              </h2>
              <p>Dados carregados diretamente da API.</p>
            </div>
            <Button
              variant="secondary"
              icon="refresh"
              onClick={() => void load()}
            >
              Atualizar
            </Button>
          </div>
          {loading ? (
            <Spinner />
          ) : data.length === 0 ? (
            <div className="table-empty">
              Nenhum registro retornado pela API.
            </div>
          ) : (
            <div className="admin-list">
              {data.map((raw) => {
                const item =
                  raw as Institution & Course & StudyArea & TaskTemplate
                return (
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
                    {"ativo" in item && (
                      <StatusBadge
                        label={item.ativo ? "Ativo" : "Desativado"}
                        status={item.ativo ? "CONCLUIDO" : "CANCELADO"}
                      />
                    )}
                  </article>
                )
              })}
            </div>
          )}
          <Notice kind="info">
            Criação e edição usam os contratos documentados, mas formulários
            administrativos ficam para a próxima etapa. Não há exclusão de
            instituições/áreas, reativação de modelos ou promoção para ADMIN na
            API.
          </Notice>
        </div>
      </div>
    </section>
  )
}
