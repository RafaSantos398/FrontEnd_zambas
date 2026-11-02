import { FormEvent, useCallback, useEffect, useState } from "react"
import { api, ApiError, getErrorMessage } from "./api"
import { Button, Notice, Spinner } from "./components"
import type {
  EducationLevel,
  LanguageLevel,
  Profile,
  SchoolStatus,
  User,
} from "./types"
import { labels } from "./types"

interface Props {
  user: User
  token: string
  onUserChange: (user: User) => void
  onUnauthorized: () => void
}

const emptyProfile: Profile = {
  nascimento: "",
  nacionalidades: [],
  paisResidencia: "",
  proficienciaIdioma: [],
  situacaoEscolaridade: "CURSANDO",
  nivelEscolaridade: "GRADUACAO",
}

export default function ProfilePage({
  user,
  token,
  onUserChange,
  onUnauthorized,
}: Props) {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [exists, setExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [tab, setTab] = useState<"profile" | "account" | "password">("profile")

  const handleError = useCallback(
    (loadError: unknown) => {
      if (loadError instanceof ApiError && loadError.status === 401)
        return onUnauthorized()
      setError(getErrorMessage(loadError))
    },
    [onUnauthorized],
  )

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    api<Profile>(`/users/${user.id}/perfil`, {
      token,
      signal: controller.signal,
    })
      .then((data) => {
        setProfile(data)
        setExists(true)
      })
      .catch((loadError) => {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        )
          return
        if (loadError instanceof ApiError && loadError.status === 404) {
          setProfile(emptyProfile)
          setExists(false)
        } else handleError(loadError)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [handleError, token, user.id])

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy("profile")
    setError("")
    setSuccess("")
    const form = new FormData(event.currentTarget)
    const proficiencies = String(form.get("proficiencias") || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [idioma, nivel] = item.split(":").map((part) => part.trim())
        return { idioma, nivel: nivel?.toUpperCase() as LanguageLevel }
      })
    const body: Profile = {
      nascimento: String(form.get("nascimento")),
      nacionalidades: String(form.get("nacionalidades"))
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      paisResidencia: String(form.get("paisResidencia")).trim(),
      proficienciaIdioma: proficiencies,
      situacaoEscolaridade: form.get("situacao") as SchoolStatus,
      nivelEscolaridade: form.get("escolaridade") as EducationLevel,
    }
    try {
      const saved = await api<Profile>(`/users/${user.id}/perfil`, {
        method: exists ? "PUT" : "POST",
        token,
        body,
      })
      setProfile(saved)
      setExists(true)
      setSuccess("Perfil salvo com sucesso.")
    } catch (saveError) {
      handleError(saveError)
    } finally {
      setBusy("")
    }
  }

  async function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy("account")
    setError("")
    setSuccess("")
    const form = new FormData(event.currentTarget)
    try {
      const updated = await api<User>(`/users/${user.id}`, {
        method: "PUT",
        token,
        body: { nome: form.get("nome"), email: form.get("email") },
      })
      onUserChange(updated)
      setSuccess(
        updated.email !== user.email
          ? "Conta atualizada. Como o e-mail mudou, entre novamente para renovar o token."
          : "Conta atualizada.",
      )
    } catch (saveError) {
      handleError(saveError)
    } finally {
      setBusy("")
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy("password")
    setError("")
    setSuccess("")
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const next = String(form.get("newPassword"))
    if (next !== form.get("confirmPassword")) {
      setError("A confirmação não corresponde à nova senha.")
      setBusy("")
      return
    }
    try {
      await api<void>(`/users/${user.id}/password`, {
        method: "PATCH",
        token,
        body: {
          currentPassword: form.get("currentPassword"),
          newPassword: next,
        },
      })
      formElement.reset()
      setSuccess("Senha alterada com sucesso.")
    } catch (saveError) {
      handleError(saveError)
    } finally {
      setBusy("")
    }
  }

  if (loading) return <Spinner label="Carregando perfil" />

  return (
    <section>
      <header className="page-heading">
        <div>
          <span className="eyebrow">Sua conta</span>
          <h1>Meu perfil</h1>
          <p>Mantenha seus dados pessoais e acadêmicos organizados.</p>
        </div>
      </header>
      {error && <Notice>{error}</Notice>}
      {success && <Notice kind="success">{success}</Notice>}
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Configurações do perfil">
          <button
            className={tab === "profile" ? "active" : ""}
            onClick={() => setTab("profile")}
          >
            Perfil do intercambista
          </button>
          <button
            className={tab === "account" ? "active" : ""}
            onClick={() => setTab("account")}
          >
            Nome e e-mail
          </button>
          <button
            className={tab === "password" ? "active" : ""}
            onClick={() => setTab("password")}
          >
            Trocar senha
          </button>
        </nav>
        <div className="panel settings-panel">
          {tab === "profile" && (
            <form onSubmit={(event) => void saveProfile(event)}>
              <div className="section-heading">
                <div>
                  <h2>
                    {exists
                      ? "Perfil do intercambista"
                      : "Complete seu primeiro perfil"}
                  </h2>
                  <p>Esses dados ajudam a registrar seu contexto acadêmico.</p>
                </div>
              </div>
              <div className="form-grid two-cols">
                <label>
                  Data de nascimento
                  <input
                    name="nascimento"
                    type="date"
                    required
                    defaultValue={profile.nascimento}
                  />
                </label>
                <label>
                  País de residência
                  <input
                    name="paisResidencia"
                    required
                    defaultValue={profile.paisResidencia}
                    placeholder="Brasil"
                  />
                </label>
                <label className="span-two">
                  Nacionalidades{" "}
                  <span className="field-help">
                    Separe mais de uma por vírgula
                  </span>
                  <input
                    name="nacionalidades"
                    required
                    defaultValue={profile.nacionalidades.join(", ")}
                    placeholder="Brasileira"
                  />
                </label>
                <label>
                  Situação escolar
                  <select
                    name="situacao"
                    defaultValue={profile.situacaoEscolaridade}
                  >
                    {Object.entries(labels.school).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Escolaridade
                  <select
                    name="escolaridade"
                    defaultValue={profile.nivelEscolaridade}
                  >
                    {Object.entries(labels.education).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="span-two">
                  Proficiências{" "}
                  <span className="field-help">
                    Formato: en:B1, es:A2. Deixe vazio se não houver.
                  </span>
                  <input
                    name="proficiencias"
                    defaultValue={profile.proficienciaIdioma
                      .map((item) => `${item.idioma}:${item.nivel}`)
                      .join(", ")}
                    placeholder="en:B1, es:A2"
                  />
                </label>
              </div>
              <div className="form-footer">
                <Button type="submit" disabled={busy === "profile"}>
                  {busy === "profile" ? "Salvando…" : "Salvar perfil"}
                </Button>
              </div>
            </form>
          )}
          {tab === "account" && (
            <form onSubmit={(event) => void saveAccount(event)}>
              <div className="section-heading">
                <div>
                  <h2>Dados da conta</h2>
                  <p>Alterar o e-mail exige um novo login.</p>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  Nome
                  <input name="nome" required defaultValue={user.nome} />
                </label>
                <label>
                  E-mail
                  <input
                    name="email"
                    type="email"
                    required
                    defaultValue={user.email}
                  />
                </label>
              </div>
              <div className="form-footer">
                <Button type="submit" disabled={busy === "account"}>
                  {busy === "account" ? "Salvando…" : "Salvar dados"}
                </Button>
              </div>
            </form>
          )}
          {tab === "password" && (
            <form onSubmit={(event) => void changePassword(event)}>
              <div className="section-heading">
                <div>
                  <h2>Trocar senha</h2>
                  <p>A nova senha deve ter ao menos 8 caracteres.</p>
                </div>
              </div>
              <div className="form-grid">
                <label>
                  Senha atual
                  <input name="currentPassword" type="password" required />
                </label>
                <label>
                  Nova senha
                  <input
                    name="newPassword"
                    type="password"
                    required
                    minLength={8}
                  />
                </label>
                <label>
                  Confirmar nova senha
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={8}
                  />
                </label>
              </div>
              <div className="form-footer">
                <Button type="submit" disabled={busy === "password"}>
                  {busy === "password" ? "Alterando…" : "Alterar senha"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
