import { useRef, useState } from "react"
import { Button } from "./components"
import { labels } from "./types"

const columns = [
  ["PENDENTE", "Pendentes"],
  ["EM_ANDAMENTO", "Em andamento"],
  ["CONCLUIDA", "Concluídas"],
]

export default function TaskBoard({ tasks, busy, onMove, onEdit, onRemove, onDeadline, removingTask, onRemovingChange }) {
  const [expanded, setExpanded] = useState(null)
  const [dragged, setDragged] = useState(null)
  const [over, setOver] = useState(null)
  const pending = useRef(false)

  async function move(task, status) {
    if (busy || pending.current || task.status === status) return
    pending.current = true
    try {
      if (await onMove(task, status)) setExpanded(null)
    } finally { pending.current = false }
  }

  function drop(event, status) {
    event.preventDefault()
    const task = tasks.find(item => item.id === dragged)
    setDragged(null); setOver(null)
    if (task) void move(task, status)
  }

  return <>
    <p className="board-hint" id="board-instructions">Arraste pelo título para mudar de coluna. Clique para ver os detalhes ou use “Mover para” dentro da tarefa.</p>
    <div className="task-board" aria-describedby="board-instructions">
      {columns.map(([status, title]) => <section key={status}
        className={`task-column compact-column${over === status ? " drop-target" : ""}`}
        aria-label={title}
        onDragOver={event => {
          if (dragged != null && !busy) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; setOver(status) }
        }}
        onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOver(null) }}
        onDrop={event => drop(event, status)}>
        <h3>{title}<span>{tasks.filter(item => item.status === status).length}</span></h3>
        {tasks.filter(item => item.status === status).map(task => <article key={task.id}
          className={`task-card compact-task${dragged === task.id ? " is-dragging" : ""}`}
          draggable={!busy}
          onDragStart={event => {
            if (busy) { event.preventDefault(); return }
            event.dataTransfer.setData("text/plain", String(task.id))
            event.dataTransfer.effectAllowed = "move"
            setDragged(task.id)
          }}
          onDragEnd={() => { setDragged(null); setOver(null) }}>
          <h4><button className="task-toggle" aria-expanded={expanded === task.id}
            aria-controls={`task-details-${task.id}`} disabled={!!busy}
            onClick={() => setExpanded(current => current === task.id ? null : task.id)}>
            <span className="task-grip" aria-hidden="true">⠿</span>
            <span>{task.titulo}</span><span className="task-chevron" aria-hidden="true">{expanded === task.id ? "−" : "+"}</span>
          </button></h4>
          <div id={`task-details-${task.id}`} hidden={expanded !== task.id} className="task-details"
            onDragStart={event => { event.preventDefault(); event.stopPropagation() }}>
            <div className="task-tags"><span>{labels.category[task.categoria] || "Outros"}</span><span>{task.personalizada ? "Criada por você" : task.modeloOrigemId ? "Do curso" : "Sugestão por tema"}</span></div>
            {task.descricao && <p>{task.descricao}</p>}
            <div className="task-field"><label htmlFor={`task-status-${task.id}`}>Mover para</label>
            <select id={`task-status-${task.id}`} value={task.status} disabled={!!busy}
              onChange={event => void move(task, event.target.value)}>
              {columns.map(([value]) => <option key={value} value={value}>{labels.task[value]}</option>)}
            </select></div>
            <div className="task-field"><label htmlFor={`task-deadline-${task.id}`}>Prazo <span className="optional-label">Opcional</span></label>
            <input id={`task-deadline-${task.id}`} type="date" value={task.prazo || ""} disabled={!!busy}
              aria-describedby={`task-deadline-help-${task.id}`}
              onChange={event => void onDeadline(task, event.target.value || null)} />
            <small id={`task-deadline-help-${task.id}`} className="control-help">Deixe em branco para manter sem prazo.</small></div>
            <div className="card-actions task-detail-actions">
              <Button variant="secondary" icon="edit" disabled={!!busy} onClick={() => onEdit(task)}>Editar</Button>
              {removingTask === task.id ? <>
                <Button variant="secondary" className="button-remove" disabled={!!busy} onClick={() => void onRemove(task)}>Confirmar remoção</Button>
                <Button variant="secondary" disabled={!!busy} onClick={() => onRemovingChange(null)}>Manter tarefa</Button>
              </> : <Button variant="secondary" className="button-remove" disabled={!!busy} onClick={() => onRemovingChange(task.id)}>Remover</Button>}
            </div>
          </div>
        </article>)}
        {!tasks.some(item => item.status === status) && <p className="empty-column">Solte uma tarefa aqui</p>}
      </section>)}
    </div>
  </>
}
