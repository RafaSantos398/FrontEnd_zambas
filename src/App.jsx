import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { api, ApiError, getErrorMessage } from "./api"

import { useDialog } from "./useDialog"

import AdminPage from "./AdminPage"

import {
  Bear,
  Button,
  EmptyState,
  Icon,
  Logo,
  Notice,
  Spinner,
  StatusBadge,
} from "./components"

import PlanDetail from "./PlanDetail"

import ProfilePage from "./ProfilePage"

import { labels } from "./types"

const emptyPlan = {
  titulo: "",

  tipoIntercambio: "CURSO_IDIOMA",

  status: "RASCUNHO",

  orcamentoTotal: null,

  moeda: "BRL",

  inicioPrevisto: null,

  duracaoMeses: null,

  dependeBolsa: false,
}

function Landing({ onNavigate }) {
  return (
    <main className="public-page">
      <nav className="public-nav">
        <Logo />
        <div>
          <button className="text-button" onClick={() => onNavigate("login")}>
            Entrar
          </button>
          <Button onClick={() => onNavigate("register")}>
            Criar minha conta
          </Button>
        </div>
      </nav>
      <section className="hero">
        <div className="hero-copy">
          <span className="hero-pill">
            Planeje com calma. Embarque com confiança.
          </span>
          <h1>
            Seu intercâmbio começa com <em>um plano.</em>
          </h1>
          <p>
            Organize cursos, prazos e cada tarefa importante em um só lugar. A
            Berxy ajuda você a transformar a vontade de ir em passos possíveis.
          </p>
          <div className="hero-actions">
            <Button onClick={() => onNavigate("register")} icon="arrow">
              Começar meu plano
            </Button>
            <Button variant="secondary" onClick={() => onNavigate("login")}>
              Já tenho uma conta
            </Button>
          </div>
          <small>
            Sem promessas mágicas. Só um caminho mais claro para chegar lá.
          </small>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="ticket ticket-one">
            <span>01</span>
            <strong>Crie seu plano</strong>
            <small>defina seu objetivo</small>
          </div>
          <div className="ticket ticket-two">
            <span>02</span>
            <strong>Escolha um curso</strong>
            <small>conecte seu destino</small>
          </div>
          <div className="ticket ticket-three">
            <span>03</span>
            <strong>Acompanhe etapas</strong>
            <small>avance no seu ritmo</small>
          </div>
          <Bear />
          <div className="hero-stamp">
            Pronto
            <br />
            para ir?
          </div>
        </div>
      </section>
      <section className="how-it-works">
        <div>
          <span className="eyebrow">Do sonho ao embarque</span>
          <h2>Um passo de cada vez</h2>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <h3>Monte seu plano</h3>
              <p>
                Registre o tipo de intercâmbio, orçamento e previsão de início.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Conecte seu curso</h3>
              <p>
                Escolha entre os cursos ativos cadastrados pela sua instituição.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Cumpra as etapas</h3>
              <p>
                Gere um checklist real e acompanhe o que está pendente ou
                concluído.
              </p>
            </div>
          </li>
        </ol>
      </section>
      <footer className="public-footer">
        <Logo />
        <p>Planejamento de intercâmbio, do seu jeito.</p>
      </footer>
    </main>
  )
}

function AuthScreen({ mode, onNavigate, onAuthenticated }) {
  const [showPassword, setShowPassword] = useState(false)

  const [busy, setBusy] = useState(false)

  const [error, setError] = useState("")

  const [success, setSuccess] = useState("")

  async function submit(event) {
    event.preventDefault()

    if (busy) return

    setBusy(true)

    setError("")

    setSuccess("")

    const form = new FormData(event.currentTarget)

    const password = String(form.get("password"))

    if (new TextEncoder().encode(password).length > 72) {
      setError("A senha deve ter no máximo 72 bytes em UTF-8.")

      setBusy(false)

      return
    }

    if (mode === "register" && password !== form.get("confirmPassword")) {
      setError("A confirmação de senha não corresponde.")

      setBusy(false)

      return
    }

    try {
      if (mode === "register") {
        await api("/auth/register", {
          method: "POST",

          body: { nome: form.get("nome"), email: form.get("email"), password },
        })

        setSuccess("Conta criada. Entre com seu e-mail e senha para continuar.")

        setTimeout(() => onNavigate("login"), 900)
      } else {
        const response = await api("/auth/login", {
          method: "POST",

          body: { email: form.get("email"), password },
        })

        if (!response.token)
          throw new Error("A API não retornou um token de acesso.")

        const current = await api("/auth/me", {
          token: response.token,
        })

        onAuthenticated(response.token, current.usuario)
      }
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-brand">
        <button
          className="logo-button"
          onClick={() => onNavigate("landing")}
          aria-label="Voltar ao início"
        >
          <Logo light />
        </button>
        <div className="auth-quote">
          <span className="eyebrow">Sua próxima história</span>
          <h2>Todo grande embarque começa com uma pequena decisão.</h2>
          <p>A gente ajuda a organizar o resto.</p>
        </div>
        <Bear />
        <small>Seu próximo passo começa aqui.</small>
      </section>
      <section className="auth-form-wrap">
        <button className="back-link" onClick={() => onNavigate("landing")}>
          <Icon name="arrow" /> Voltar
        </button>
        <div className="auth-form">
          <span className="eyebrow">
            {mode === "login" ? "Bem-vindo de volta" : "Comece por aqui"}
          </span>
          <h1>{mode === "login" ? "Entre na sua conta" : "Crie sua conta"}</h1>
          <p>
            {mode === "login"
              ? "Continue organizando os próximos passos do seu intercâmbio."
              : "Seu primeiro plano está a poucos passos de distância."}
          </p>
          {error && <Notice>{error}</Notice>}
          {success && <Notice kind="success">{success}</Notice>}
          <form onSubmit={(event) => void submit(event)}>
            {mode === "register" && (
              <label>
                Nome completo
                <input
                  name="nome"
                  required
                  autoComplete="name"
                  placeholder="Como podemos chamar você?"
                />
              </label>
            )}
            <label>
              E-mail
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@exemplo.com"
              />
            </label>
            <label>
              Senha
              <span className="password-field">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={mode === "register" ? 8 : undefined}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="Mínimo de 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  <Icon name="eye" />
                </button>
              </span>
            </label>
            {mode === "register" && (
              <label>
                Confirmar senha
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Digite novamente"
                />
              </label>
            )}
            <Button type="submit" disabled={busy} icon="arrow">
              {busy
                ? "Enviando…"
                : mode === "login"
                  ? "Entrar"
                  : "Criar minha conta"}
            </Button>
          </form>
          <div className="auth-switch">
            {mode === "login"
              ? "Ainda não tem uma conta?"
              : "Já tem uma conta?"}{" "}
            <button
              onClick={() =>
                onNavigate(mode === "login" ? "register" : "login")
              }
            >
              {mode === "login" ? "Cadastre-se" : "Entrar"}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

function PlanForm({ plan, token, onClose, onSaved, onUnauthorized }) {
  const initial = plan || emptyPlan

  const dialogRef = useDialog(onClose)

  const [busy, setBusy] = useState(false)

  const [error, setError] = useState("")

  async function submit(event) {
    event.preventDefault()

    setBusy(true)

    setError("")

    const form = new FormData(event.currentTarget)

    const optional = (name) => String(form.get(name) || "").trim() || null

    const body = {
      titulo: String(form.get("titulo")).trim(),

      tipoIntercambio: form.get("tipo"),

      status: form.get("status"),

      orcamentoTotal:
        optional("orcamento") === null ? null : Number(optional("orcamento")),

      moeda: optional("moeda")?.toUpperCase() || null,

      inicioPrevisto: optional("inicio"),

      duracaoMeses:
        optional("duracao") === null ? null : Number(optional("duracao")),

      dependeBolsa: form.get("bolsa") === "on",
    }

    try {
      const saved = await api(
        plan ? `/planos-intercambio/${plan.id}` : "/planos-intercambio",

        { method: plan ? "PUT" : "POST", token, body },
      )

      onSaved(saved)
    } catch (saveError) {
      if (saveError instanceof ApiError && saveError.status === 401)
        onUnauthorized()
      else setError(getErrorMessage(saveError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal modal-wide"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="icon-button modal-close"
          aria-label="Fechar"
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
        <span className="panel-kicker">
          {plan ? "Atualizar planejamento" : "Novo começo"}
        </span>
        <h2 id="plan-form-title">{plan ? "Editar plano" : "Criar um plano"}</h2>
        <p>Você poderá escolher o curso e gerar tarefas depois.</p>
        {error && <Notice>{error}</Notice>}
        <form
          className="form-grid two-cols"
          onSubmit={(event) => void submit(event)}
        >
          <label className="span-two">
            Título do plano
            <input
              name="titulo"
              required
              maxLength={100}
              defaultValue={initial.titulo}
              placeholder="Ex.: Curso de inglês em 2027"
            />
          </label>
          <label>
            Tipo de intercâmbio
            <select name="tipo" defaultValue={initial.tipoIntercambio}>
              {Object.entries(labels.exchange).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select name="status" defaultValue={initial.status}>
              {Object.entries(labels.plan).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Orçamento total
            <input
              name="orcamento"
              type="number"
              min="0"
              step="0.01"
              defaultValue={initial.orcamentoTotal ?? ""}
              placeholder="15000,00"
            />
          </label>
          <label>
            Moeda
            <input
              name="moeda"
              maxLength={3}
              minLength={3}
              defaultValue={initial.moeda ?? "BRL"}
              placeholder="BRL"
            />
          </label>
          <label>
            Início previsto
            <input
              name="inicio"
              type="date"
              defaultValue={initial.inicioPrevisto ?? ""}
            />
          </label>
          <label>
            Duração em meses
            <input
              name="duracao"
              type="number"
              min="1"
              defaultValue={initial.duracaoMeses ?? ""}
            />
          </label>
          <label className="check-field span-two">
            <input
              name="bolsa"
              type="checkbox"
              defaultChecked={initial.dependeBolsa ?? false}
            />
            <span>
              <strong>Este plano depende de bolsa</strong>
              <small>
                É apenas uma indicação no planejamento; não há catálogo de
                bolsas.
              </small>
            </span>
          </label>
          <div className="modal-actions span-two">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Salvando…" : plan ? "Salvar alterações" : "Criar plano"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CoursesPage({ token, onUnauthorized }) {
  const [courses, setCourses] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState("")

  useEffect(() => {
    api("/cursos", { token })

      .then(setCourses)

      .catch((loadError) => {
        if (loadError instanceof ApiError && loadError.status === 401)
          onUnauthorized()
        else setError(getErrorMessage(loadError))
      })

      .finally(() => setLoading(false))
  }, [onUnauthorized, token])

  return (
    <section>
      <header className="page-heading">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h1>Cursos</h1>
          <p>
            Explore os cursos cadastrados e ativos para encontrar um caminho
            compatível.
          </p>
        </div>
      </header>
      {error && <Notice>{error}</Notice>}
      {loading ? (
        <Spinner label="Carregando cursos" />
      ) : courses.filter((item) => item.ativo).length ? (
        <div className="course-grid">
          {courses

            .filter((item) => item.ativo)

            .map((course) => (
              <article className="panel course-card" key={course.id}>
                <div className="course-icon">
                  <Icon name="course" />
                </div>
                <span className="panel-kicker">
                  {labels.exchange[course.tipoIntercambio]}
                </span>
                <h2>{course.nome}</h2>
                <strong>{course.instituicaoNome}</strong>
                <p>{course.descricao || "Sem descrição informada."}</p>
                <footer>
                  <span>{course.idioma || "Idioma não informado"}</span>
                  <span>
                    {course.duracaoMeses
                      ? `${course.duracaoMeses} meses`
                      : "Duração não informada"}
                  </span>
                </footer>
              </article>
            ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhum curso ativo"
          text="Um administrador precisa cadastrar e ativar cursos antes que eles possam ser escolhidos em um plano."
        />
      )}
    </section>
  )
}

export default function App() {
  const [publicView, setPublicView] = useState("landing")

  const [token, setToken] = useState(null)

  const sessionToken = useRef(null)

  const [user, setUser] = useState(null)

  const [view, setView] = useState("overview")

  const [plans, setPlans] = useState([])

  const [plansLoading, setPlansLoading] = useState(false)

  const [plansError, setPlansError] = useState("")

  const [selectedPlan, setSelectedPlan] = useState(null)

  const [editingPlan, setEditingPlan] = useState(null)

  const [menuOpen, setMenuOpen] = useState(false)

  const [sessionMessage, setSessionMessage] = useState("")

  const logoutLocal = useCallback((message = "") => {
    sessionToken.current = null

    setToken(null)

    setUser(null)

    setPlans([])

    setSelectedPlan(null)

    setEditingPlan(null)

    setView("overview")

    setMenuOpen(false)

    setPlansError("")

    setPlansLoading(false)

    setPublicView("login")

    setSessionMessage(message)
  }, [])

  const handleUnauthorized = useCallback(
    (message = "Sua sessão expirou. Entre novamente.") => {
      if (sessionToken.current === token) logoutLocal(message)
    },
    [logoutLocal, token],
  )

  function navigate(next) {
    setSelectedPlan(null)

    setEditingPlan(null)

    setView(next)

    setMenuOpen(false)
  }

  const loadPlans = useCallback(
    async (signal) => {
      if (!token || sessionToken.current !== token) return

      setPlansLoading(true)

      setPlansError("")

      try {
        const data = await api("/planos-intercambio", { token, signal })

        if (sessionToken.current === token) setPlans(data)
      } catch (error) {
        if (error.name === "AbortError" || sessionToken.current !== token)
          return

        if (error instanceof ApiError && error.status === 401)
          handleUnauthorized()
        else setPlansError(getErrorMessage(error))
      } finally {
        if (sessionToken.current === token) setPlansLoading(false)
      }
    },
    [handleUnauthorized, token],
  )

  useEffect(() => {
    const controller = new AbortController()

    if (token) void loadPlans(controller.signal)

    return () => controller.abort()
  }, [loadPlans, token])

  function logout() {
    const previousToken = token

    logoutLocal("Você saiu da sua conta com segurança.")

    if (previousToken)
      void api("/auth/logout", { method: "POST", token: previousToken }).catch(
        () => {},
      )
  }

  const counts = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(labels.plan).map((status) => [
          status,

          plans.filter((plan) => plan.status === status).length,
        ]),
      ),

    [plans],
  )

  const nav = [
    ["overview", "Visão geral", "home"],

    ["plans", "Meus planos", "plans"],

    ["courses", "Cursos", "course"],

    ["profile", "Meu perfil", "profile"],

    ...(user?.role === "ADMIN" ? [["admin", "Administração", "admin"]] : []),
  ]

  if (!token || !user) {
    if (publicView === "landing")
      return (
        <Landing
          onNavigate={(next) => {
            setSessionMessage("")

            setPublicView(next)
          }}
        />
      )

    return (
      <>
        <AuthScreen
          key={publicView}
          mode={publicView}
          onNavigate={(next) => {
            setSessionMessage("")

            setPublicView(next)
          }}
          onAuthenticated={(nextToken, nextUser) => {
            sessionToken.current = nextToken

            setToken(nextToken)

            setUser(nextUser)

            setView("overview")

            setSessionMessage("")
          }}
        />
        {sessionMessage && (
          <div className="toast">
            <Icon name="check" />
            {sessionMessage}
          </div>
        )}
      </>
    )
  }

  if (selectedPlan)
    return (
      <div className="app-shell">
        <Sidebar
          user={user}
          nav={nav}
          view={view}
          setView={navigate}
          onLogout={() => void logout()}
          open={menuOpen}
          setOpen={setMenuOpen}
        />
        <main className="app-main">
          <MobileHeader setOpen={setMenuOpen} open={menuOpen} />
          <PlanDetail
            plan={selectedPlan}
            token={token}
            onBack={() => {
              setSelectedPlan(null)

              setView("plans")

              void loadPlans()
            }}
            onPlanChange={(updated) => {
              if (sessionToken.current !== token) return

              setSelectedPlan(updated)

              setPlans((current) =>
                current.map((item) =>
                  item.id === updated.id ? updated : item,
                ),
              )
            }}
            onUnauthorized={handleUnauthorized}
          />
        </main>
      </div>
    )

  const planCards = plans.map((plan) => (
    <article
      className="panel plan-card"
      key={plan.id}
      onClick={() => setSelectedPlan(plan)}
    >
      <div className="plan-card-top">
        <div className="plan-symbol">
          <Icon
            name={plan.tipoIntercambio === "TRABALHO" ? "plans" : "course"}
          />
        </div>
        <StatusBadge label={labels.plan[plan.status]} status={plan.status} />
      </div>
      <span className="panel-kicker">
        {labels.exchange[plan.tipoIntercambio]}
      </span>
      <h2>{plan.titulo}</h2>
      <div className="plan-meta">
        <span>
          <Icon name="calendar" size={17} />
          {plan.inicioPrevisto
            ? plan.inicioPrevisto.split("-").reverse().join("/")
            : "Sem data prevista"}
        </span>
        <span>
          <Icon name="clock" size={17} />
          {plan.duracaoMeses ? `${plan.duracaoMeses} meses` : "Duração aberta"}
        </span>
      </div>
      <footer>
        <button
          onClick={(event) => {
            event.stopPropagation()

            setEditingPlan(plan)
          }}
        >
          <Icon name="edit" size={17} /> Editar
        </button>
        <button onClick={() => setSelectedPlan(plan)}>
          Abrir plano <Icon name="arrow" size={17} />
        </button>
      </footer>
    </article>
  ))

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        nav={nav}
        view={view}
        setView={(next) => {
          setView(next)

          setMenuOpen(false)
        }}
        onLogout={() => void logout()}
        open={menuOpen}
        setOpen={setMenuOpen}
      />
      <main className="app-main">
        <MobileHeader setOpen={setMenuOpen} open={menuOpen} />
        {view === "overview" && (
          <section>
            <header className="dashboard-hero">
              <div>
                <span className="eyebrow">Olá, {user.nome.split(" ")[0]}</span>
                <h1>Para onde vamos agora?</h1>
                <p>Veja o que já está no mapa e escolha seu próximo passo.</p>
                <Button icon="plus" onClick={() => setEditingPlan("new")}>
                  Criar plano
                </Button>
              </div>
              <Bear />
            </header>
            {plansError && <Notice>{plansError}</Notice>}
            <div className="stats">
              {Object.entries(labels.plan).map(([status, label]) => (
                <article key={status}>
                  <span>{label}</span>
                  <strong>{counts[status]}</strong>
                </article>
              ))}
            </div>
            <div className="section-heading">
              <div>
                <span className="panel-kicker">Seus caminhos</span>
                <h2>Planos recentes</h2>
              </div>
              {plans.length > 0 && (
                <Button variant="ghost" onClick={() => setView("plans")}>
                  Ver todos <Icon name="arrow" />
                </Button>
              )}
            </div>
            {plansLoading ? (
              <Spinner label="Carregando seus planos" />
            ) : planCards.length ? (
              <div className="plan-grid">{planCards.slice(0, 3)}</div>
            ) : (
              !plansError && (
                <EmptyState
                  title="Vamos organizar seu primeiro plano?"
                  text="Comece registrando seu objetivo. Você poderá conectar curso, checklist e preparação depois."
                  action={
                    <Button icon="plus" onClick={() => setEditingPlan("new")}>
                      Criar primeiro plano
                    </Button>
                  }
                />
              )
            )}
          </section>
        )}
        {view === "plans" && (
          <section>
            <header className="page-heading">
              <div>
                <span className="eyebrow">Planejamento</span>
                <h1>Meus planos</h1>
                <p>
                  Todos os seus objetivos de intercâmbio, organizados em um
                  lugar.
                </p>
              </div>
              <Button icon="plus" onClick={() => setEditingPlan("new")}>
                Criar plano
              </Button>
            </header>
            {plansError && <Notice>{plansError}</Notice>}
            {plansLoading ? (
              <Spinner />
            ) : planCards.length ? (
              <div className="plan-grid">{planCards}</div>
            ) : (
              !plansError && (
                <EmptyState
                  title="Nenhum plano por aqui"
                  text="Crie seu primeiro plano para começar."
                  action={
                    <Button onClick={() => setEditingPlan("new")}>
                      Criar plano
                    </Button>
                  }
                />
              )
            )}
          </section>
        )}
        {view === "courses" && (
          <CoursesPage token={token} onUnauthorized={handleUnauthorized} />
        )}
        {view === "profile" && (
          <ProfilePage
            user={user}
            token={token}
            onUserChange={(updated) => {
              if (sessionToken.current === token) setUser(updated)
            }}
            onUnauthorized={handleUnauthorized}
          />
        )}
        {view === "admin" && user.role === "ADMIN" && (
          <AdminPage token={token} onUnauthorized={handleUnauthorized} />
        )}
      </main>
      {editingPlan && (
        <PlanForm
          plan={editingPlan === "new" ? undefined : editingPlan}
          token={token}
          onClose={() => setEditingPlan(null)}
          onUnauthorized={handleUnauthorized}
          onSaved={(saved) => {
            if (sessionToken.current !== token) return

            setPlans((current) =>
              editingPlan === "new"
                ? [saved, ...current]
                : current.map((item) => (item.id === saved.id ? saved : item)),
            )

            setEditingPlan(null)

            setSelectedPlan(saved)
          }}
        />
      )}
    </div>
  )
}

function Sidebar({ user, nav, view, setView, onLogout, open, setOpen }) {
  useEffect(() => {
    if (!open) return

    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("keydown", onKey)

    return () => document.removeEventListener("keydown", onKey)
  }, [open, setOpen])

  return (
    <>
      <div
        className={`sidebar-overlay ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside id="main-navigation" className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-head">
          <Logo light />
          <button
            className="icon-button mobile-close"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          >
            <Icon name="close" />
          </button>
        </div>
        <nav>
          {nav.map(([value, label, icon]) => (
            <button
              key={value}
              className={view === value ? "active" : ""}
              onClick={() => setView(value)}
            >
              <Icon name={icon} />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-account">
          <div className="avatar">{user.nome.slice(0, 2).toUpperCase()}</div>
          <div>
            <strong>{user.nome}</strong>
            <span>
              {user.role === "ADMIN" ? "Administrador" : "Intercambista"}
            </span>
          </div>
          <button aria-label="Sair da conta" onClick={onLogout}>
            <Icon name="logout" />
          </button>
        </div>
      </aside>
    </>
  )
}

function MobileHeader({ setOpen, open }) {
  return (
    <header className="mobile-header">
      <Logo />
      <button
        className="icon-button"
        aria-label="Abrir menu"
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(true)}
      >
        <Icon name="menu" />
      </button>
    </header>
  )
}
