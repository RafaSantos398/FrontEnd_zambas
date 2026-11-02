import { useEffect, useState } from "react"
import { api, getErrorMessage } from "./api"
import { Button, Notice, Spinner } from "./components"

const situations = {
  SEM_META: "Comece definindo uma meta de custo total.",
  META_ATINGIDA: "O valor que você informou já cobre a meta atual.",
  SEM_DATA: "Defina o início previsto na edição do plano para comparar o aporte com o prazo.",
  SEM_MESES_DISPONIVEIS: "Não há meses completos até o início previsto. Revise a data ou o valor que ainda falta.",
  SEM_APORTE: "Ainda falta reservar dinheiro. Informe quanto consegue guardar por mês.",
  NO_CAMINHO: "Com os valores informados, sua previsão cobre a meta até o início.",
  AJUSTAR_APORTE: "O ritmo informado ainda não cobre a meta até o início. Revise o aporte, a meta ou a data.",
}

export default function FinancePage({ plan, token, onSaved, onError }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    api(`/planos-intercambio/${plan.id}/financeiro`, { token, signal: controller.signal })
      .then(setData).catch(error => { if (!controller.signal.aborted) { setError(getErrorMessage(error)); onError(error) } })
    return () => controller.abort()
  }, [plan.id, token, onError])
  async function save(event) {
    event.preventDefault()
    if (busy) return
    const form = new FormData(event.currentTarget)
    setBusy(true); setError(""); setSaved(false)
    try {
      const updated = await api(`/planos-intercambio/${plan.id}/financeiro`, { token, method: "PUT", body: {
        metaTotal: Number(form.get("meta")), valorGuardado: Number(form.get("guardado")), aporteMensal: Number(form.get("aporte")),
      } })
      setData(updated); setSaved(true); onSaved({ ...plan, orcamentoTotal: updated.metaTotal })
    } catch (error) { setError(getErrorMessage(error)); onError(error) }
    finally { setBusy(false) }
  }
  const money = value => value == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: data.moeda }).format(value)
  return <div className="content-stack">
    <div className="section-heading"><div><span className="panel-kicker">Do objetivo à reserva</span><h2>Meu planejamento financeiro</h2></div></div>
    {error && <Notice>{error}</Notice>}
    {!data ? !error && <Spinner label="Carregando planejamento financeiro" /> : <>
      <form className="panel content-panel finance-form" onSubmit={save}>
        <p>Use suas próprias estimativas na moeda do plano ({data.moeda}). A meta total também atualiza o orçamento do resumo.</p>
        <div className="form-grid">
          <label>Quanto preciso no total<input type="number" name="meta" min="0" max="999999999999.99" step="0.01" required defaultValue={data.metaTotal ?? ""} /></label>
          <label>Quanto já tenho guardado<input type="number" name="guardado" min="0" max="999999999999.99" step="0.01" required defaultValue={data.valorGuardado} /></label>
          <label>Quanto consigo guardar por mês<input type="number" name="aporte" min="0" max="999999999999.99" step="0.01" required defaultValue={data.aporteMensal} /></label>
        </div>
        <Button type="submit" disabled={busy}>{busy ? "Salvando…" : "Salvar e calcular"}</Button>
        {saved && <Notice kind="success">Valores salvos no plano.</Notice>}
      </form>
      <Notice kind={data.situacao === "NO_CAMINHO" || data.situacao === "META_ATINGIDA" ? "success" : "info"}>{situations[data.situacao]}</Notice>
      <div className="finance-results">
        {[["Ainda falta", money(data.valorRestante)], ["Meses completos até o início", data.mesesAteInicio ?? "Defina uma data"],
          ["Quanto guardar por mês para chegar lá", money(data.aporteNecessario)],
          ["Meses para atingir a meta no ritmo atual", data.mesesParaMeta ?? "Informe um aporte"],
          ["Previsão guardada até o início", money(data.previsaoNoInicio)]].map(([title, value]) =>
          <article className="panel finance-result" key={title}><span>{title}</span><strong>{value}</strong></article>)}
      </div>
      <p className="help-text">A conta considera o valor já guardado e aportes iguais por mês completo até a data prevista. Não inclui juros, rendimentos, inflação ou conversão de moeda. Revise suas estimativas de passagens, moradia, curso e despesas pessoais.</p>
    </>}
  </div>
}
