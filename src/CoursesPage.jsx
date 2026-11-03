import { useCallback, useEffect, useState } from "react"
import { api, ApiError, getErrorMessage } from "./api"
import { Button, EmptyState, Notice, Spinner } from "./components"
import { useDialog } from "./useDialog"

export const courseTags = {
  FINANCEIRO: "Financeiro", LINGUISTICO: "Linguístico", ACADEMICO: "Acadêmico",
  PROFISSIONAL: "Profissional", CULTURAL: "Cultural", OUTROS: "Outros",
}
const dateLabel = date => date ? date.split("-").reverse().join("/") : "Sem data"

function CourseEditor({ course, token, onClose, onSaved, onUnauthorized }) {
  const [tags, setTags] = useState(course?.etiquetas || [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const dialogRef = useDialog(() => { if (!busy) onClose() })
  async function save(event) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    const optional = name => String(form.get(name) || "").trim() || null
    if (!tags.length) { setError("Selecione pelo menos uma etiqueta."); return }
    setBusy(true); setError("")
    try {
      const saved = await api(`/cursos/pessoais${course ? `/${course.id}` : ""}`, {
        token, method: course ? "PUT" : "POST", body: {
          nome: optional("nome"), descricao: optional("descricao"), instituicaoNome: optional("instituicaoNome"),
          idioma: optional("idioma"), inicioPrevisto: optional("inicio"), fimPrevisto: optional("fim"), link: optional("link"), etiquetas: tags,
        },
      })
      onSaved(saved)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onUnauthorized()
      else setError(getErrorMessage(error))
    } finally { setBusy(false) }
  }
  return <div className="modal-backdrop"><div className="modal course-editor" role="dialog" aria-modal="true" aria-labelledby="personal-course-title" ref={dialogRef}>
    <span className="eyebrow">Sua preparação</span>
    <h2 id="personal-course-title">{course ? "Editar meu curso" : "Cadastrar meu curso"}</h2>
    <p>Registre um curso que ajuda no seu intercâmbio. Depois, adicione-o ao cronograma de um plano.</p>
    {error && <Notice>{error}</Notice>}
    <form className="form-grid" onSubmit={save}>
      <label className="span-two">Nome do curso<input name="nome" maxLength={100} required defaultValue={course?.nome || ""} placeholder="Ex.: Inglês para entrevistas ou organização financeira" /></label>
      <label><span>Instituição ou plataforma <span className="optional-label">Opcional</span></span><input name="instituicaoNome" maxLength={100} defaultValue={course?.instituicaoNome || ""} placeholder="Ex.: escola, plataforma online" /></label>
      <label>Idioma das aulas<input name="idioma" required pattern="[A-Za-z]{2}(-[A-Za-z]{2})?" defaultValue={course?.idioma || "pt-BR"} placeholder="pt-BR ou en" /></label>
      <label><span>Início previsto <span className="optional-label">Opcional</span></span><input type="date" name="inicio" defaultValue={course?.inicioPrevisto || ""} /></label>
      <label><span>Término previsto <span className="optional-label">Opcional</span></span><input type="date" name="fim" defaultValue={course?.fimPrevisto || ""} /></label>
      <label className="span-two"><span>Link do curso <span className="optional-label">Opcional</span></span><input name="link" type="url" maxLength={500} defaultValue={course?.link || ""} placeholder="https://..." /></label>
      <fieldset className="span-two course-tag-picker"><legend>Em que este curso ajuda?</legend><p>Selecione uma ou mais etiquetas.</p>
        <div>{Object.entries(courseTags).map(([value, label]) => <label key={value}>
          <input type="checkbox" value={value} checked={tags.includes(value)} onChange={event => setTags(current => event.target.checked ? [...current, value] : current.filter(item => item !== value))} />{label}
        </label>)}</div>
      </fieldset>
      <label className="span-two"><span>Objetivo e observações <span className="optional-label">Opcional</span></span><textarea name="descricao" maxLength={500} defaultValue={course?.descricao || ""} placeholder="O que você quer aprender e como isso ajuda na sua preparação?" /></label>
      {course && <small className="control-help span-two">As etapas já adicionadas mantêm seus prazos e progresso. Ajuste-as pelo checklist do plano.</small>}
      <div className="modal-actions span-two"><Button type="button" variant="secondary" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar curso"}</Button></div>
    </form>
  </div></div>
}

export default function CoursesPage({ token, onUnauthorized, plan, onScheduled }) {
  const [courses, setCourses] = useState([])
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editor, setEditor] = useState(null)
  const [scheduling, setScheduling] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState("")
  const [busy, setBusy] = useState(null)
  const [filter, setFilter] = useState("")
  const handleError = useCallback(error => {
    if (error instanceof ApiError && error.status === 401) onUnauthorized()
    else setError(getErrorMessage(error))
  }, [onUnauthorized])
  useEffect(() => {
    const controller = new AbortController()
    Promise.all([api("/cursos", { token, signal: controller.signal }),
      plan ? Promise.resolve([plan]) : api("/planos-intercambio", { token, signal: controller.signal })])
      .then(([courses, plans]) => { if (!controller.signal.aborted) { setCourses(courses); setPlans(plans) } })
      .catch(error => { if (!controller.signal.aborted) handleError(error) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token, plan?.id, handleError])

  async function schedule(course, planId) {
    if (!planId || busy) return
    setBusy(course.id); setError(""); setSuccess("")
    try {
      const task = await api(`/planos-intercambio/${planId}/tarefas/curso`, { token, method: "POST", body: { cursoId: course.id } })
      onScheduled?.(task)
      setSuccess(`“${course.nome}” está no checklist de “${plans.find(item => String(item.id) === String(planId))?.titulo || "seu plano"}”. A etapa usa o término previsto como prazo; você pode ajustar pelo checklist.`)
      setScheduling(null)
    } catch (error) { handleError(error) }
    finally { setBusy(null) }
  }
  const personal = courses.filter(course => course.pessoal && (!filter || course.etiquetas.includes(filter)))
  return <section className="content-stack personal-courses">
    <header className={plan ? "section-heading" : "page-heading"}><div><span className="eyebrow">Cursos criados por você</span>
      {plan ? <h2>Meus cursos de apoio</h2> : <h1>Meus cursos</h1>}
      <p>Organize o que quer aprender e transforme os estudos em etapas do seu plano.</p>
    </div><Button icon="plus" onClick={() => { setEditor("new"); setError("") }}>Cadastrar curso</Button></header>
    {error && <Notice>{error}</Notice>}{success && <Notice kind="success">{success}</Notice>}
    <div className="course-filter"><label htmlFor="course-tag-filter">Filtrar por contribuição</label><select id="course-tag-filter" value={filter} onChange={event => setFilter(event.target.value)}><option value="">Todas as etiquetas</option>{Object.entries(courseTags).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
    {loading ? <Spinner label="Carregando meus cursos" /> : !personal.length ? <EmptyState title={filter ? "Nenhum curso com esta etiqueta" : "Seus cursos começam aqui"} text="Cadastre cursos de idioma, finanças, carreira e outras áreas. Você escolhe como eles ajudam no intercâmbio." /> : <div className="course-grid">
      {personal.map(course => <article className="panel course-card personal-course" key={course.id}>
        <div className="task-tags">{course.etiquetas.map(tag => <span key={tag}>{courseTags[tag]}</span>)}</div>
        <h3>{course.nome}</h3>{course.instituicaoNome && <strong>{course.instituicaoNome}</strong>}
        <p>{course.descricao || "Defina seu objetivo na edição do curso."}</p>
        <dl className="course-dates"><div><dt>Início</dt><dd>{dateLabel(course.inicioPrevisto)}</dd></div><div><dt>Término</dt><dd>{dateLabel(course.fimPrevisto)}</dd></div></dl>
        {course.link && <a className="notes-link" href={course.link} target="_blank" rel="noopener noreferrer">Acessar curso ↗</a>}
        <div className="card-actions"><Button variant="secondary" icon="edit" onClick={() => setEditor(course)}>Editar</Button>
          <Button disabled={!!busy} onClick={() => plan ? void schedule(course, plan.id) : setScheduling(scheduling === course.id ? null : course.id)}>{busy === course.id ? "Adicionando…" : "Adicionar ao cronograma"}</Button></div>
        {!plan && scheduling === course.id && <div className="course-schedule">
          {plans.length ? <><label htmlFor={`course-plan-${course.id}`}>Qual plano?</label><select id={`course-plan-${course.id}`} value={selectedPlan} onChange={event => setSelectedPlan(event.target.value)}><option value="">Selecione um plano</option>{plans.map(item => <option key={item.id} value={item.id}>{item.titulo}</option>)}</select>
          <Button disabled={!selectedPlan || !!busy} onClick={() => void schedule(course, selectedPlan)}>Confirmar no checklist</Button></> : <p>Crie um plano em “Meus planos” para organizar este curso no cronograma.</p>}
        </div>}
      </article>)}
    </div>}
    {editor && <CourseEditor key={editor.id || "new"} course={editor === "new" ? null : editor} token={token} onUnauthorized={onUnauthorized}
      onClose={() => setEditor(null)} onSaved={saved => { setCourses(current => [saved, ...current.filter(item => item.id !== saved.id)]); setEditor(null); setSuccess("Curso salvo na sua conta.") }} />}
  </section>
}
