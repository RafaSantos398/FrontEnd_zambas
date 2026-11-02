import { useCallback, useEffect, useState } from "react"

import { api, ApiError, getErrorMessage } from "./api"

import { Button, Notice, Spinner } from "./components"

import { labels } from "./types"

const emptyProfile = {
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
}) {
  const [profile, setProfile] = useState(emptyProfile)

  const [exists, setExists] = useState(false)

  const [loading, setLoading] = useState(true)

  const [busy, setBusy] = useState("")

  const [error, setError] = useState("")

  const [success, setSuccess] = useState("")

  const [tab, setTab] = useState("profile")

  const handleError = useCallback(
    (loadError) => {
      if (loadError instanceof ApiError && loadError.status === 401)
        return onUnauthorized()

      setError(getErrorMessage(loadError))
    },

    [onUnauthorized],
  )

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)

    api(`/users/${user.id}/perfil`, {
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

  async function saveProfile(event) {
    event.preventDefault()

    if (busy) return

    setBusy("profile")

    setError("")

    setSuccess("")

    const form = new FormData(event.currentTarget)

    const proficiencies = profile.proficienciaIdioma.map((item) => ({
      idioma: item.idioma.trim(),
      nivel: item.nivel,
    }))

    const body = {
      nascimento: String(form.get("nascimento")),

      nacionalidades: String(form.get("nacionalidades"))

        .split(",")

        .map((item) => item.trim())

        .filter(Boolean),

      paisResidencia: String(form.get("paisResidencia")).trim(),

      proficienciaIdioma: proficiencies,

      situacaoEscolaridade: form.get("situacao"),

      nivelEscolaridade: form.get("escolaridade"),
    }

    try {
      const saved = await api(`/users/${user.id}/perfil`, {
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

  async function saveAccount(event) {
    event.preventDefault()

    if (busy) return

    setBusy("account")

    setError("")

    setSuccess("")

    const form = new FormData(event.currentTarget)

    try {
      const updated = await api(`/users/${user.id}`, {
        method: "PUT",

        token,

        body: { nome: form.get("nome"), email: form.get("email") },
      })

      if (updated.email !== user.email) {
        onUnauthorized(
          "Seu e-mail foi atualizado. Entre novamente com o novo endereço.",
        )

        return
      }

      onUserChange(updated)

      setSuccess("Conta atualizada.")
    } catch (saveError) {
      handleError(saveError)
    } finally {
      setBusy("")
    }
  }

  async function changePassword(event) {
    event.preventDefault()

    if (busy) return

    setBusy("password")

    setError("")

    setSuccess("")

    const formElement = event.currentTarget

    const form = new FormData(formElement)

    const next = String(form.get("newPassword"))

    if (new TextEncoder().encode(next).length > 72) {
      setError("A nova senha deve ter no máximo 72 bytes em UTF-8.")

      setBusy("")

      return
    }

    if (next !== form.get("confirmPassword")) {
      setError("A confirmação não corresponde à nova senha.")

      setBusy("")

      return
    }

    try {
      await api(`/users/${user.id}/password`, {
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
                <fieldset className="span-two proficiency-fields">
                  <legend>Proficiências em idiomas</legend>
                  <p className="field-help">
                    Adicione os idiomas que você já estuda. Você também pode
                    deixar esta lista vazia.
                  </p>
                  {profile.proficienciaIdioma.map((item, index) => (
                    <div className="proficiency-row" key={index}>
                      <label>
                        Idioma
                        <input
                          required
                          pattern="[A-Za-z]{2}(-[A-Za-z]{2})?"
                          placeholder="en ou pt-BR"
                          value={item.idioma}
                          onChange={(event) =>
                            setProfile((current) => ({
                              ...current,
                              proficienciaIdioma:
                                current.proficienciaIdioma.map((row, i) =>
                                  i === index
                                    ? { ...row, idioma: event.target.value }
                                    : row,
                                ),
                            }))
                          }
                        />
                      </label>
                      <label>
                        Nível
                        <select
                          value={item.nivel}
                          onChange={(event) =>
                            setProfile((current) => ({
                              ...current,
                              proficienciaIdioma:
                                current.proficienciaIdioma.map((row, i) =>
                                  i === index
                                    ? { ...row, nivel: event.target.value }
                                    : row,
                                ),
                            }))
                          }
                        >
                          {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                            <option key={level}>{level}</option>
                          ))}
                        </select>
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setProfile((current) => ({
                            ...current,
                            proficienciaIdioma:
                              current.proficienciaIdioma.filter(
                                (_, i) => i !== index,
                              ),
                          }))
                        }
                      >
                        Remover idioma
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      setProfile((current) => ({
                        ...current,
                        proficienciaIdioma: [
                          ...current.proficienciaIdioma,
                          { idioma: "", nivel: "A1" },
                        ],
                      }))
                    }
                  >
                    Adicionar idioma
                  </Button>
                </fieldset>
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
