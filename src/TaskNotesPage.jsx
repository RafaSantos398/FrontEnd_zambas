import { useEffect, useRef, useState } from "react"
import { api, ApiError, getErrorMessage } from "./api"
import { Button, Notice, Spinner } from "./components"
import { useDialog } from "./useDialog"

const guides = {
  MORADIA: ["Opção / endereço / contato", "Aluguel e moeda", "Caução e custos extras", "Distância e transporte", "Vantagens", "Desvantagens", "Links e decisão"],
  FINANCAS: ["Item ou opção comparada", "Valor e moeda", "Custos extras", "Fonte e data da estimativa", "Vantagens e desvantagens", "Decisão / próximo passo"],
  DOCUMENTOS: ["Documento e órgão responsável", "Requisitos", "Taxa e moeda", "Prazo / agendamento", "Link oficial", "Pendências / próximo passo"],
  VIAGEM: ["Opção / trajeto", "Data e horário", "Preço e moeda", "Bagagem e taxas", "Regras de alteração", "Vantagens e desvantagens", "Link / decisão"],
  IDIOMA: ["Objetivo", "Curso / recurso", "Custo e moeda", "Rotina de estudo", "O que já pratiquei", "Dificuldades / próximo passo"],
  ESTUDOS: ["Curso / instituição", "Requisitos e prazos", "Custo e moeda", "Reconhecimento / aproveitamento", "Vantagens e desvantagens", "Links / próximo passo"],
}
const fallback = ["Informações e opções", "Custos e moeda", "Vantagens", "Desvantagens", "Links / contatos", "Decisão / próximo passo"]

export default function TaskNotesPage({ task, plan, token, onBack, onUnauthorized, registerNavigationGuard }) {
  const [text, setText] = useState("")
  const [savedText, setSavedText] = useState("")
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState(false)
  const [pendingExit, setPendingExit] = useState(null)
  const exitDialogRef = useDialog(() => setPendingExit(null), pendingExit !== null)
  const titleRef = useRef(null)
  const dirty = text !== savedText
  const categoryThemes = { DOCUMENTACAO: "DOCUMENTOS", FINANCEIRO: "FINANCAS", INSCRICAO: "ESTUDOS" }
  const prompts = guides[task.tema] || guides[categoryThemes[task.categoria] || task.categoria] || fallback
  const path = `/planos-intercambio/${plan.id}/tarefas/${task.id}/anotacoes`

  useEffect(() => {
    setLoading(true); setError(""); setLoaded(false)
    titleRef.current?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
    const controller = new AbortController()
    api(path, { token, signal: controller.signal }).then(data => {
      setText(data.texto); setSavedText(data.texto); setUpdatedAt(data.atualizadoEm)
      setLoaded(true)
    }).catch(error => {
      if (controller.signal.aborted) return
      if (error instanceof ApiError && error.status === 401) onUnauthorized()
      else setError(getErrorMessage(error))
    }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [path, token, onUnauthorized, attempt])

  useEffect(() => {
    registerNavigationGuard(action => {
      if (busy) return false
      if (!dirty) return true
      setPendingExit(() => action)
      return false
    })
    return () => registerNavigationGuard(null)
  }, [dirty, busy, registerNavigationGuard])

  useEffect(() => {
    if (!dirty) return
    const warn = event => { event.preventDefault(); event.returnValue = "" }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  function back() {
    if (dirty) setPendingExit(() => onBack)
    else onBack()
  }

  async function save(event) {
    event.preventDefault()
    if (busy || !loaded) return
    setBusy(true); setError(""); setSaved(false)
    try {
      const data = await api(path, { token, method: "PUT", body: { texto: text } })
      setText(data.texto); setSavedText(data.texto); setUpdatedAt(data.atualizadoEm); setSaved(true)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onUnauthorized()
      else setError(getErrorMessage(error))
    } finally { setBusy(false) }
  }

  return <section className="task-notes-page content-stack">
    <button className="back-link" disabled={busy} onClick={back}>← Voltar ao checklist</button>
    <header className="page-heading"><div>
      <span className="eyebrow">Caderno da tarefa · {plan.titulo}</span>
      <h1 ref={titleRef} tabIndex={-1}>{task.titulo}</h1>
      <p>{task.descricao || "Reúna as informações que ajudam você a concluir esta etapa."}</p>
    </div></header>
    {error && <Notice>{error}{!loaded && <Button variant="secondary" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</Button>}</Notice>}
    {loading ? <Spinner label="Carregando anotações" /> : <>
      <aside className="panel content-panel notes-guide">
        <h2>O que vale anotar</h2>
        <p>Compare opções, guarde contatos e registre sua decisão. Estas sugestões são só um ponto de partida.</p>
        <ul>{prompts.map(prompt => <li key={prompt}>{prompt}</li>)}</ul>
      </aside>
      <form className="panel content-panel notes-editor" onSubmit={save}>
        <div className="section-heading"><h2>Minhas anotações</h2>
          <Button type="button" variant="secondary" disabled={busy || !!text || !loaded}
            onClick={() => { setText(prompts.map(prompt => `${prompt}:\n`).join("\n")); setSaved(false) }}>Usar modelo de preenchimento</Button>
        </div>
        <p>Salvas nesta tarefa da sua conta. Para comparar várias opções, repita os tópicos no texto.</p>
        <label htmlFor="task-notes">Anotações, comparações e próximos passos</label>
        <textarea id="task-notes" value={text} maxLength={10000} disabled={busy || !loaded}
          aria-describedby="task-notes-help" placeholder={`Comece por ${prompts[0].toLowerCase()} e registre o que descobriu…`}
          onChange={event => { setText(event.target.value); setSaved(false) }} />
        <div id="task-notes-help" className="notes-save-state"><span>{text.length.toLocaleString("pt-BR")} / 10.000 caracteres</span>
          <span>{dirty ? "Alterações ainda não salvas" : updatedAt ? `Salvo em ${new Date(updatedAt).toLocaleString("pt-BR")}` : "Nenhuma anotação salva"}</span></div>
        <Button type="submit" disabled={busy || !dirty || !loaded}>{busy ? "Salvando…" : "Salvar anotações"}</Button>
        {saved && <Notice kind="success">Anotações salvas. Você pode voltar ao checklist.</Notice>}
      </form>
    </>}
    {pendingExit && <div className="modal-backdrop">
      <div className="modal" ref={exitDialogRef} role="dialog" aria-modal="true" aria-labelledby="notes-exit-title">
        <h2 id="notes-exit-title">Sair sem salvar as anotações?</h2>
        <p>As alterações feitas desde o último salvamento serão descartadas.</p>
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={() => setPendingExit(null)}>Continuar anotando</Button>
          <Button type="button" onClick={() => { registerNavigationGuard(null); pendingExit() }}>Sair sem salvar</Button>
        </div>
      </div>
    </div>}
  </section>
}
