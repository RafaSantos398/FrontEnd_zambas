import { FormEvent, useCallback, useEffect, useMemo, useState } from "react"
import { api, ApiError, getErrorMessage } from "./api"
import {
  Button,
  EmptyState,
  Icon,
  Notice,
  Spinner,
  StatusBadge,
} from "./components"
import type {
  Course,
  LanguageLevel,
  Plan,
  PlanStatus,
  Preparation,
  Task,
} from "./types"
import { labels } from "./types"

interface Props {
  plan: Plan
  token: string
  onBack: () => void
  onPlanChange: (plan: Plan) => void
  onUnauthorized: () => void
}

const levels: LanguageLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"]

function localDate(date: string | null) {
  if (!date) return "Sem prazo"
  const [year, month, day] = date.split("-")
  return `${day}/${month}/${year}`
}

export default function PlanDetail({
  plan,
  token,
  onBack,
  onPlanChange,
  onUnauthorized,
}: Props) {
  const [tab, setTab] = useState<"summary" | "course" | "tasks" | "language">(
    "summary",
  )
  const [tasks, setTasks] = useState<Task[]>([])
  const [preparations, setPreparations] = useState<Preparation[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [courseId, setCourseId] = useState("")
  const [showPreparation, setShowPreparation] = useState(false)

  const guard = useCallback(
    (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        onUnauthorized()
        return
      }
      setError(getErrorMessage(error))
    },
    [onUnauthorized],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [taskData, prepData, courseData] = await Promise.all([
        api<Task[]>(`/planos-intercambio/${plan.id}/tarefas`, { token }),
        api<Preparation[]>(
          `/planos-intercambio/${plan.id}/preparacoes-idioma`,
          { token },
        ),
        api<Course[]>("/cursos", { token }),
      ])
      setTasks(taskData)
      setPreparations(prepData)
      setCourses(
        courseData.filter(
          (course) =>
            course.ativo && course.tipoIntercambio === plan.tipoIntercambio,
        ),
      )
    } catch (loadError) {
      guard(loadError)
    } finally {
      setLoading(false)
    }
  }, [guard, plan.id, plan.tipoIntercambio, token])

  useEffect(() => {
    void load()
  }, [load])

  const completed = tasks.filter((task) => task.status === "CONCLUIDA").length
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0
  const money =
    plan.orcamentoTotal == null
      ? "Não informado"
      : new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: plan.moeda || "BRL",
        }).format(plan.orcamentoTotal)

  async function mutate<T>(
    key: string,
    request: () => Promise<T>,
    update: (value: T) => void,
    message: string,
  ) {
    setBusy(key)
    setError("")
    setSuccess("")
    try {
      const value = await request()
      update(value)
      setSuccess(message)
    } catch (mutationError) {
      guard(mutationError)
    } finally {
      setBusy(null)
    }
  }

  async function selectCourse() {
    if (!courseId) return
    await mutate(
      "course",
      () =>
        api<Plan>(`/planos-intercambio/${plan.id}/curso`, {
          method: "PATCH",
          token,
          body: { cursoId: Number(courseId) },
        }),
      onPlanChange,
      "Curso selecionado. Agora você pode gerar o checklist.",
    )
  }

  async function changePlanStatus(status: PlanStatus) {
    await mutate(
      "plan-status",
      () =>
        api<Plan>(`/planos-intercambio/${plan.id}/status`, {
          method: "PATCH",
          token,
          body: { status },
        }),
      onPlanChange,
      "Status do plano atualizado.",
    )
  }

  async function generateTasks() {
    await mutate(
      "generate",
      () =>
        api<Task[]>(`/planos-intercambio/${plan.id}/tarefas/gerar-checklist`, {
          method: "POST",
          token,
        }),
      setTasks,
      "Checklist sincronizado sem perder o progresso existente.",
    )
  }

  async function taskAction(
    task: Task,
    action: "iniciar" | "concluir" | "reabrir",
  ) {
    await mutate(
      `task-${task.id}`,
      () =>
        api<Task>(
          `/planos-intercambio/${plan.id}/tarefas/${task.id}/${action}`,
          { method: "PATCH", token },
        ),
      (updated) =>
        setTasks((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        ),
      action === "concluir"
        ? "Tarefa concluída. Mais uma etapa na mochila!"
        : "Tarefa atualizada.",
    )
  }

  async function setDeadline(task: Task, prazo: string | null) {
    await mutate(
      `task-${task.id}`,
      () =>
        api<Task>(`/planos-intercambio/${plan.id}/tarefas/${task.id}/prazo`, {
          method: "PATCH",
          token,
          body: { prazo },
        }),
      (updated) =>
        setTasks((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        ),
      prazo ? "Prazo definido." : "Prazo removido.",
    )
  }

  async function preparationAction(
    item: Preparation,
    action: "iniciar" | "concluir",
  ) {
    await mutate(
      `prep-${item.id}`,
      () =>
        api<Preparation>(
          `/planos-intercambio/${plan.id}/preparacoes-idioma/${item.id}/${action}`,
          { method: "PATCH", token },
        ),
      (updated) =>
        setPreparations((current) =>
          current.map((prep) => (prep.id === updated.id ? updated : prep)),
        ),
      "Preparação atualizada.",
    )
  }

  async function createPreparation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = {
      idioma: String(form.get("idioma")).trim(),
      nivelAlvo: form.get("nivelAlvo"),
      dataMeta: form.get("dataMeta"),
      minutosSemanaisPlanejados: Number(form.get("minutos")),
    }
    await mutate(
      "new-preparation",
      () =>
        api<Preparation>(`/planos-intercambio/${plan.id}/preparacoes-idioma`, {
          method: "POST",
          token,
          body,
        }),
      (created) => {
        setPreparations((current) => [...current, created])
        setShowPreparation(false)
      },
      "Preparação adicionada.",
    )
  }

  const taskGroups = useMemo(
    () =>
      ([
        ["EM_ANDAMENTO", "Em andamento"],
        ["PENDENTE", "Pendentes"],
        ["CONCLUIDA", "Concluídas"],
      ] as const).map(([status, title]) => ({
        status,
        title,
        items: tasks.filter((task) => task.status === status),
      })),
    [tasks],
  )

  return (
    <section className="detail-page">
      <button className="back-link" onClick={onBack}>
        <Icon name="arrow" /> Voltar aos planos
      </button>
      <header className="detail-header">
        <div>
          <div className="eyebrow">
            Plano de {labels.exchange[plan.tipoIntercambio].toLowerCase()}
          </div>
          <h1>{plan.titulo}</h1>
          <StatusBadge label={labels.plan[plan.status]} status={plan.status} />
        </div>
        <label className="compact-field">
          Status do plano
          <select
            value={plan.status}
            onChange={(event) =>
              void changePlanStatus(event.target.value as PlanStatus)
            }
            disabled={busy === "plan-status"}
          >
            {Object.entries(labels.plan).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {error && <Notice>{error}</Notice>}
      {success && <Notice kind="success">{success}</Notice>}

      <nav className="tabs" aria-label="Seções do plano">
        {([
          ["summary", "Resumo"],
          ["course", "Curso"],
          [
            "tasks",
            `Checklist${tasks.length ? ` (${completed}/${tasks.length})` : ""}`,
          ],
          ["language", "Preparação de idioma"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            className={tab === value ? "active" : ""}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </nav>

      {loading ? (
        <Spinner label="Carregando dados do plano" />
      ) : (
        <>
          {tab === "summary" && (
            <div className="summary-grid">
              <article className="panel progress-panel">
                <span className="panel-kicker">Progresso do checklist</span>
                <div className="progress-number">
                  {tasks.length ? `${progress}%` : "—"}
                </div>
                <div
                  className="progress-track"
                  aria-label={`${completed} de ${tasks.length} tarefas concluídas`}
                >
                  <span style={{ width: `${progress}%` }} />
                </div>
                <p>
                  {tasks.length
                    ? `${completed} de ${tasks.length} tarefas concluídas`
                    : "Gere o checklist após escolher um curso."}
                </p>
              </article>
              <article className="panel facts-panel">
                <h2>Seu planejamento</h2>
                <dl>
                  <div>
                    <dt>Orçamento</dt>
                    <dd>{money}</dd>
                  </div>
                  <div>
                    <dt>Início previsto</dt>
                    <dd>{localDate(plan.inicioPrevisto)}</dd>
                  </div>
                  <div>
                    <dt>Duração</dt>
                    <dd>
                      {plan.duracaoMeses
                        ? `${plan.duracaoMeses} meses`
                        : "Não informada"}
                    </dd>
                  </div>
                  <div>
                    <dt>Depende de bolsa</dt>
                    <dd>{plan.dependeBolsa ? "Sim" : "Não"}</dd>
                  </div>
                </dl>
              </article>
              <article className="panel next-panel">
                <span className="panel-kicker">Próximo passo</span>
                <h2>
                  {!plan.cursoSelecionado
                    ? "Escolha o curso que combina com o plano"
                    : tasks.length === 0
                      ? "Gere seu checklist personalizado"
                      : "Continue avançando nas tarefas"}
                </h2>
                <Button
                  onClick={() =>
                    setTab(!plan.cursoSelecionado ? "course" : "tasks")
                  }
                  icon="arrow"
                >
                  Continuar planejamento
                </Button>
              </article>
            </div>
          )}

          {tab === "course" && (
            <div className="panel content-panel">
              <div className="section-heading">
                <div>
                  <span className="panel-kicker">Catálogo real</span>
                  <h2>Curso do intercâmbio</h2>
                </div>
              </div>
              {plan.cursoSelecionado ? (
                <Notice kind="info">
                  Curso selecionado. A API não devolve o identificador ou nome
                  do curso no plano; por isso, esses dados não podem ser
                  reconstruídos após recarregar. A troca fica bloqueada depois
                  da geração de tarefas.
                </Notice>
              ) : courses.length ? (
                <div className="course-picker">
                  <label>
                    Selecione um curso ativo
                    <select
                      value={courseId}
                      onChange={(event) => setCourseId(event.target.value)}
                    >
                      <option value="">Escolha uma opção</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.nome} — {course.instituicaoNome}
                        </option>
                      ))}
                    </select>
                  </label>
                  {courseId &&
                    (() => {
                      const course = courses.find(
                        (item) => item.id === Number(courseId),
                      )
                      return course ? (
                        <div className="course-preview">
                          <strong>{course.nome}</strong>
                          <span>{course.instituicaoNome}</span>
                          <p>{course.descricao || "Sem descrição."}</p>
                          <small>
                            {course.idioma || "Idioma não informado"} ·{" "}
                            {course.duracaoMeses
                              ? `${course.duracaoMeses} meses`
                              : "Duração não informada"}
                          </small>
                        </div>
                      ) : null
                    })()}
                  <Button
                    onClick={() => void selectCourse()}
                    disabled={!courseId || busy === "course"}
                  >
                    {busy === "course" ? "Confirmando…" : "Confirmar curso"}
                  </Button>
                </div>
              ) : (
                <EmptyState
                  title="Nenhum curso compatível disponível"
                  text="O catálogo não retornou cursos ativos para este tipo de intercâmbio. Um administrador precisa cadastrar e ativar o curso."
                />
              )}
            </div>
          )}

          {tab === "tasks" && (
            <div className="content-stack">
              <div className="section-heading">
                <div>
                  <span className="panel-kicker">Etapas do plano</span>
                  <h2>Checklist</h2>
                </div>
                <Button
                  onClick={() => void generateTasks()}
                  disabled={busy === "generate"}
                  icon="refresh"
                >
                  {busy === "generate"
                    ? "Sincronizando…"
                    : tasks.length
                      ? "Sincronizar checklist"
                      : "Gerar checklist"}
                </Button>
              </div>
              {!tasks.length ? (
                <EmptyState
                  title="Seu checklist ainda está vazio"
                  text={
                    plan.cursoSelecionado
                      ? "Gere as tarefas com base nos modelos ativos associados ao curso."
                      : "Escolha um curso antes de gerar as tarefas."
                  }
                />
              ) : (
                <div className="task-board">
                  {taskGroups.map((group) => (
                    <section className="task-column" key={group.status}>
                      <h3>
                        {group.title} <span>{group.items.length}</span>
                      </h3>
                      {group.items.map((task) => (
                        <article className="task-card" key={task.id}>
                          <StatusBadge
                            label={labels.task[task.status]}
                            status={task.status}
                          />
                          <h4>{task.titulo}</h4>
                          {task.descricao && <p>{task.descricao}</p>}
                          <div className="deadline">
                            <Icon name="calendar" size={17} />
                            <label>
                              Prazo{" "}
                              <input
                                type="date"
                                value={task.prazo || ""}
                                onChange={(event) =>
                                  void setDeadline(
                                    task,
                                    event.target.value || null,
                                  )
                                }
                                disabled={busy === `task-${task.id}`}
                              />
                            </label>
                          </div>
                          <div className="card-actions">
                            {task.status === "PENDENTE" && (
                              <Button
                                variant="secondary"
                                onClick={() => void taskAction(task, "iniciar")}
                                disabled={busy === `task-${task.id}`}
                              >
                                Iniciar
                              </Button>
                            )}
                            {task.status !== "CONCLUIDA" && (
                              <Button
                                onClick={() =>
                                  void taskAction(task, "concluir")
                                }
                                disabled={busy === `task-${task.id}`}
                              >
                                Concluir
                              </Button>
                            )}
                            {task.status === "CONCLUIDA" && (
                              <Button
                                variant="secondary"
                                onClick={() => void taskAction(task, "reabrir")}
                                disabled={busy === `task-${task.id}`}
                              >
                                Reabrir
                              </Button>
                            )}
                          </div>
                        </article>
                      ))}
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "language" && (
            <div className="content-stack">
              <div className="section-heading">
                <div>
                  <span className="panel-kicker">Preparação contínua</span>
                  <h2>Idioma</h2>
                </div>
                <Button icon="plus" onClick={() => setShowPreparation(true)}>
                  Nova preparação
                </Button>
              </div>
              {!preparations.length ? (
                <EmptyState
                  title="Nenhuma preparação cadastrada"
                  text="Defina o idioma, seu nível-alvo e uma meta semanal para começar."
                  action={
                    <Button onClick={() => setShowPreparation(true)}>
                      Criar preparação
                    </Button>
                  }
                />
              ) : (
                <div className="cards-grid">
                  {preparations.map((item) => (
                    <article className="panel prep-card" key={item.id}>
                      <div className="prep-top">
                        <div className="language-mark">
                          {item.idioma.toUpperCase()}
                        </div>
                        <StatusBadge
                          label={labels.preparation[item.status]}
                          status={item.status}
                        />
                      </div>
                      <h3>Nível-alvo {item.nivelAlvo}</h3>
                      <p>
                        <Icon name="calendar" size={17} /> Meta em{" "}
                        {localDate(item.dataMeta)}
                      </p>
                      <p>
                        <Icon name="clock" size={17} />{" "}
                        {item.minutosSemanaisPlanejados} min planejados por
                        semana
                      </p>
                      <div className="card-actions">
                        {item.status === "NAO_INICIADA" && (
                          <Button
                            onClick={() =>
                              void preparationAction(item, "iniciar")
                            }
                            disabled={busy === `prep-${item.id}`}
                          >
                            Iniciar
                          </Button>
                        )}
                        {item.status === "EM_ANDAMENTO" && (
                          <Button
                            onClick={() =>
                              void preparationAction(item, "concluir")
                            }
                            disabled={busy === `prep-${item.id}`}
                          >
                            Concluir
                          </Button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showPreparation && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={() => setShowPreparation(false)}
        >
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="prep-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="icon-button modal-close"
              aria-label="Fechar"
              onClick={() => setShowPreparation(false)}
            >
              <Icon name="close" />
            </button>
            <span className="panel-kicker">Nova meta</span>
            <h2 id="prep-title">Preparação de idioma</h2>
            <form
              className="form-grid"
              onSubmit={(event) => void createPreparation(event)}
            >
              <label>
                Idioma{" "}
                <input
                  name="idioma"
                  required
                  pattern="[A-Za-z]{2}(-[A-Za-z]{2})?"
                  placeholder="Ex.: en ou pt-BR"
                />
              </label>
              <label>
                Nível-alvo{" "}
                <select name="nivelAlvo" defaultValue="B2">
                  {levels.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </label>
              <label>
                Data-meta <input name="dataMeta" required type="date" />
              </label>
              <label>
                Minutos por semana{" "}
                <input
                  name="minutos"
                  required
                  type="number"
                  min="1"
                  placeholder="180"
                />
              </label>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPreparation(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={busy === "new-preparation"}>
                  {busy === "new-preparation"
                    ? "Salvando…"
                    : "Adicionar preparação"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
