import { useCallback, useEffect, useState } from "react"

import { api, ApiError, getErrorMessage } from "./api"

import {
  Button,
  EmptyState,
  Icon,
  Notice,
  Spinner,
  StatusBadge,
} from "./components"

import { useDialog } from "./useDialog"

import { labels } from "./types"
import ChecklistTools from "./ChecklistTools"
import FinancePage from "./FinancePage"
import TaskBoard from "./TaskBoard"
import TaskNotesPage from "./TaskNotesPage"

const levels = ["A1", "A2", "B1", "B2", "C1", "C2"]

function localDate(date) {
  if (!date) return "Sem prazo"

  const [year, month, day] = date.split("-")

  return `${day}/${month}/${year}`
}

export default function PlanDetail({
  registerNavigationGuard,
  plan,

  token,

  onBack,

  onPlanChange,

  onUnauthorized,
}) {
  const [tab, setTab] = useState("summary")
  const [notesTask, setNotesTask] = useState(null)

  const [tasks, setTasks] = useState([])
  const [editingTask, setEditingTask] = useState(null)
  const [removingTask, setRemovingTask] = useState(null)
  const courseTasks = tasks.some(task => task.modeloOrigemId != null)

  const [preparations, setPreparations] = useState([])

  const [courses, setCourses] = useState([])

  const [loading, setLoading] = useState(true)

  const [busy, setBusy] = useState(null)

  const [error, setError] = useState("")

  const [success, setSuccess] = useState("")

  const [courseId, setCourseId] = useState(
    plan.cursoId ? String(plan.cursoId) : "",
  )

  const [editingPreparation, setEditingPreparation] = useState(null)

  const [showPreparation, setShowPreparation] = useState(false)

  const dialogRef = useDialog(() => setShowPreparation(false), showPreparation)

  const guard = useCallback(
    (error) => {
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
        api(`/planos-intercambio/${plan.id}/tarefas`, { token }),

        api(`/planos-intercambio/${plan.id}/preparacoes-idioma`, { token }),

        api("/cursos", { token }),
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

  async function mutate(key, request, update, message) {
    if (busy) return

    setBusy(key)

    setError("")

    setSuccess("")

    try {
      const value = await request()

      update(value)

      setSuccess(message)
      return true
    } catch (mutationError) {
      guard(mutationError)
      return false
    } finally {
      setBusy(null)
    }
  }

  async function selectCourse() {
    if (!courseId) return

    await mutate(
      "course",

      () =>
        api(`/planos-intercambio/${plan.id}/curso`, {
          method: "PATCH",

          token,

          body: { cursoId: Number(courseId) },
        }),

      onPlanChange,

      "Curso selecionado. Você pode adicionar as tarefas específicas dele ao checklist.",
    )
  }

  async function changePlanStatus(status) {
    await mutate(
      "plan-status",

      () =>
        api(`/planos-intercambio/${plan.id}/status`, {
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
        api(`/planos-intercambio/${plan.id}/tarefas/gerar-checklist`, {
          method: "POST",

          token,
        }),

      setTasks,

      "Checklist sincronizado sem perder o progresso existente.",
    )
  }

  async function moveTask(task, status) {
    return await mutate(
      `task-${task.id}`,

      () =>
        api(`/planos-intercambio/${plan.id}/tarefas/${task.id}/status`, {
          method: "PATCH",

          token,
          body: { status },
        }),

      (updated) =>
        setTasks((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        ),

      `Tarefa movida para ${labels.task[status].toLowerCase()}.`,
    )
  }

  async function removeTask(task) {
    await mutate(`task-${task.id}`, () => api(`/planos-intercambio/${plan.id}/tarefas/${task.id}`, {
      method: "DELETE", token,
    }), () => {
      setTasks(current => current.filter(item => item.id !== task.id))
      if (editingTask?.id === task.id) setEditingTask(null)
      setRemovingTask(null)
    }, "Tarefa removida do plano.")
  }

  async function setDeadline(task, prazo) {
    await mutate(
      `task-${task.id}`,

      () =>
        api(`/planos-intercambio/${plan.id}/tarefas/${task.id}/prazo`, {
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

  async function preparationAction(item, action) {
    await mutate(
      `prep-${item.id}`,

      () =>
        api(
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

  async function createPreparation(event) {
    event.preventDefault()

    if (busy) return

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
        api(
          `/planos-intercambio/${plan.id}/preparacoes-idioma${
            editingPreparation ? "/" + editingPreparation.id : ""
          }`,

          {
            method: editingPreparation ? "PUT" : "POST",

            token,

            body,
          },
        ),

      (created) => {
        setPreparations((current) =>
          editingPreparation
            ? current.map((item) => (item.id === created.id ? created : item))
            : [...current, created],
        )

        setShowPreparation(false)
      },

      editingPreparation ? "Preparação salva." : "Preparação adicionada.",
    )
  }

  if (notesTask) return <TaskNotesPage key={notesTask.id} task={notesTask} plan={plan} token={token}
    onUnauthorized={onUnauthorized} onBack={() => setNotesTask(null)} registerNavigationGuard={registerNavigationGuard} />

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
            onChange={(event) => void changePlanStatus(event.target.value)}
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

      {error && !showPreparation && <Notice>{error}</Notice>}
      {success && <Notice kind="success">{success}</Notice>}

      <nav className="tabs" aria-label="Seções do plano">
        {[
          ["summary", "Resumo"],

          ["course", "Curso"],

          [
            "tasks",

            `Checklist${tasks.length ? ` (${completed}/${tasks.length})` : ""}`,
          ],

          ["language", "Preparação de idioma"],
          ["finance", "Finanças"],
        ].map(([value, label]) => (
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
                    : "Escolha temas ou crie suas próprias tarefas, mesmo sem curso."}
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
                  {tasks.length === 0
                      ? "Gere seu checklist personalizado"
                      : "Continue avançando nas tarefas"}
                </h2>
                <Button
                  onClick={() =>
                    setTab("tasks")
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
              {plan.cursoSelecionado && (
                <Notice kind="info">
                  Curso selecionado:{" "}
                  <strong>{plan.cursoNome || "Curso definido"}</strong>.{" "}
                  {courseTasks
                    ? "O curso não pode ser alterado depois de adicionar tarefas específicas dele."
                    : "Tarefas por tema e tarefas próprias não impedem escolher ou trocar o curso."}
                </Notice>
              )}
              {courseTasks ? null : courses.length ? (
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
                  text="Ainda não há cursos ativos para este tipo. Você pode continuar nas abas Checklist, Finanças e Preparação de idioma sem escolher um curso."
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
                  disabled={busy === "generate" || !plan.cursoSelecionado}
                  icon="refresh"
                >
                  {busy === "generate"
                    ? "Sincronizando…"
                    : "Adicionar tarefas do curso"}
                </Button>
              </div>
              <ChecklistTools plan={plan} token={token} hasTasks={tasks.length > 0} onTasksChange={setTasks}
                onError={guard} editingTask={editingTask} onEditDone={() => setEditingTask(null)} />
              {!tasks.length ? (
                <EmptyState
                  title="Seu checklist ainda está vazio"
                  text="Adicione um ou mais temas acima ou use Nova tarefa para montar um checklist pessoal."
                />
              ) : (
                <TaskBoard tasks={tasks} busy={busy} onMove={moveTask} onEdit={setEditingTask}
                  onRemove={removeTask} onDeadline={setDeadline} removingTask={removingTask}
                  onRemovingChange={setRemovingTask} onNotes={setNotesTask} />
              )}
            </div>
          )}

          {tab === "finance" && <FinancePage plan={plan} token={token} onSaved={onPlanChange} onError={guard} />}

          {tab === "language" && (
            <div className="content-stack">
              <div className="section-heading">
                <div>
                  <span className="panel-kicker">Preparação contínua</span>
                  <h2>Idioma</h2>
                </div>
                <Button
                  icon="plus"
                  onClick={() => {
                    setEditingPreparation(null)

                    setShowPreparation(true)
                  }}
                >
                  Nova preparação
                </Button>
              </div>
              {!preparations.length ? (
                <EmptyState
                  title="Nenhuma preparação cadastrada"
                  text="Defina o idioma, seu nível-alvo e uma meta semanal para começar."
                  action={
                    <Button
                      onClick={() => {
                        setEditingPreparation(null)

                        setShowPreparation(true)
                      }}
                    >
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
                        <Button
                          variant="secondary"
                          icon="edit"
                          onClick={() => {
                            setEditingPreparation(item)

                            setShowPreparation(true)
                          }}
                        >
                          Editar preparação
                        </Button>
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
            ref={dialogRef}
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
            <span className="panel-kicker">
              {editingPreparation ? "Editar meta" : "Nova meta"}
            </span>
            <h2 id="prep-title">Preparação de idioma</h2>
            {error && <Notice>{error}</Notice>}
            <form
              className="form-grid"
              onSubmit={(event) => void createPreparation(event)}
            >
              <label>
                Idioma{" "}
                <input
                  name="idioma"
                  defaultValue={editingPreparation?.idioma || ""}
                  required
                  pattern="[A-Za-z]{2}(-[A-Za-z]{2})?"
                  placeholder="Ex.: en ou pt-BR"
                />
              </label>
              <label>
                Nível-alvo{" "}
                <select
                  name="nivelAlvo"
                  defaultValue={editingPreparation?.nivelAlvo || "B2"}
                >
                  {levels.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </label>
              <label>
                Data-meta{" "}
                <input
                  name="dataMeta"
                  defaultValue={editingPreparation?.dataMeta || ""}
                  required
                  type="date"
                />
              </label>
              <label>
                Minutos por semana{" "}
                <input
                  name="minutos"
                  defaultValue={
                    editingPreparation?.minutosSemanaisPlanejados || ""
                  }
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
                    : editingPreparation
                      ? "Salvar preparação"
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
