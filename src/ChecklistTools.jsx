import { useEffect, useRef, useState } from "react"
import { api, getErrorMessage } from "./api"
import { Button, Notice } from "./components"
import { labels } from "./types"

export default function ChecklistTools({ plan, token, onTasksChange, onError, editingTask, onEditDone }) {
  const [themes, setThemes] = useState([])
  const [selected, setSelected] = useState([])
  const [busy, setBusy] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const editorRef = useRef(null)
  useEffect(() => {
    if (editingTask || showForm) {
      editorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
      editorRef.current?.querySelector("input")?.focus({ preventScroll: true })
    }
  }, [editingTask, showForm])

  useEffect(() => {
    const controller = new AbortController()
    api(`/planos-intercambio/${plan.id}/tarefas/temas`, { token, signal: controller.signal })
      .then(setThemes).catch(error => { if (!controller.signal.aborted) onError(error) })
    return () => controller.abort()
  }, [plan.id, token, onError])

  async function generate() {
    if (busy || !selected.length) return
    setBusy(true); setError(""); setMessage("")
    try {
      const tasks = await api(`/planos-intercambio/${plan.id}/tarefas/gerar-temas`, {
        token, method: "POST", body: { temas: selected },
      })
      onTasksChange(tasks)
      setMessage("Temas adicionados. Suas tarefas, prazos e conclusões foram preservados.")
    } catch (error) { setError(getErrorMessage(error)); onError(error) }
    finally { setBusy(false) }
  }

  async function save(event) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    setBusy(true); setError(""); setMessage("")
    try {
      const task = await api(`/planos-intercambio/${plan.id}/tarefas${editingTask ? `/${editingTask.id}` : ""}`, {
        token, method: editingTask ? "PUT" : "POST",
        body: { titulo: form.get("titulo").trim(), descricao: form.get("descricao").trim(),
          categoria: form.get("categoria"), prazo: form.get("prazo") || null },
      })
      onTasksChange(current => editingTask ? current.map(item => item.id === task.id ? task : item) : [...current, task])
      setShowForm(false); onEditDone(); setMessage("Tarefa salva no seu plano.")
    } catch (error) { setError(getErrorMessage(error)); onError(error) }
    finally { setBusy(false) }
  }

  return <section className="panel content-panel checklist-tools">
    <div className="section-heading"><div><h3>Monte o checklist do seu jeito</h3>
      <p>Escolha temas, combine sugestões e crie suas tarefas. Nenhum curso é obrigatório.</p></div>
      <Button icon="plus" disabled={busy} onClick={() => { onEditDone(); setShowForm(true); setError("") }}>Nova tarefa</Button>
    </div>
    {error && <Notice>{error}</Notice>}
    {message && <Notice kind="success">{message}</Notice>}
    <fieldset className="theme-options" disabled={busy}><legend>Temas para adicionar ao plano</legend>
      {themes.map(item => <label key={item.tema} className="theme-choice">
        <input type="checkbox" checked={selected.includes(item.tema)} onChange={event => setSelected(current =>
          event.target.checked ? [...current, item.tema] : current.filter(value => value !== item.tema))} />
        <span>{item.titulo}<small>{item.quantidade} sugestões</small></span>
      </label>)}
    </fieldset>
    <Button disabled={busy || !selected.length} onClick={() => void generate()}>{busy ? "Salvando…" : "Adicionar temas selecionados"}</Button>
    <p className="help-text">Adicionar o mesmo tema novamente não duplica tarefas. Uma sugestão removida pode voltar se você adicionar esse tema de novo.</p>
    {(showForm || editingTask) && <form ref={editorRef} className="task-editor" onSubmit={save} key={editingTask?.id || "nova"}>
      <h3>{editingTask ? "Editar tarefa" : "Criar minha tarefa"}</h3>
      <label>Título<input name="titulo" maxLength={200} required defaultValue={editingTask?.titulo || ""} /></label>
      <label>Descrição<textarea name="descricao" maxLength={400} rows={3} defaultValue={editingTask?.descricao || ""} /></label>
      <div className="form-grid"><label>Categoria<select name="categoria" defaultValue={editingTask?.categoria || "OUTROS"}>
        {Object.entries(labels.category).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label><label>Prazo<input type="date" name="prazo" defaultValue={editingTask?.prazo || ""} /></label></div>
      <div className="card-actions"><Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar tarefa"}</Button>
        <Button variant="secondary" disabled={busy} onClick={() => { setShowForm(false); onEditDone() }}>Cancelar edição</Button></div>
    </form>}
  </section>
}
