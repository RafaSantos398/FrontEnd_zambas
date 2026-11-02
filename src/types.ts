export type Role = "USER" | "ADMIN"
export type ExchangeType = "GRADUACAO" | "POS_GRADUACAO" | "CURSO_IDIOMA" | "ENSINO_MEDIO" | "TRABALHO"
export type PlanStatus = "RASCUNHO" | "EM_ANDAMENTO" | "CONCLUIDO" | "CANCELADO"
export type TaskStatus = "PENDENTE" | "EM_ANDAMENTO" | "CONCLUIDA"
export type PreparationStatus = "NAO_INICIADA" | "EM_ANDAMENTO" | "CONCLUIDA"
export type LanguageLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2"
export type SchoolStatus = "CURSANDO" | "CONCLUIDO" | "INTERROMPIDO"
export type EducationLevel = "ENSINO_FUNDAMENTAL" | "ENSINO_MEDIO" | "GRADUACAO" | "POS_GRADUACAO" | "MESTRADO" | "DOUTORADO"
export type TemplateCategory = "DOCUMENTACAO" | "IDIOMA" | "FINANCEIRO" | "INSCRICAO" | "OUTROS"

export interface User {
  id: number
  nome: string
  email: string
  role: Role
  active: boolean
  createdAt?: string
  updatedAt?: string
}

export interface AuthResponse {
  token: string | null
  usuario: User
}

export interface Plan {
  id: number
  titulo: string
  tipoIntercambio: ExchangeType
  status: PlanStatus
  orcamentoTotal: number | null
  moeda: string | null
  inicioPrevisto: string | null
  duracaoMeses: number | null
  dependeBolsa: boolean | null
  cursoSelecionado: boolean
}

export type PlanPayload = Omit<Plan, "id" | "cursoSelecionado">

export interface Course {
  id: number
  instituicaoId: number
  instituicaoNome: string
  nome: string
  descricao: string | null
  tipoIntercambio: ExchangeType
  idioma: string | null
  duracaoMeses: number | null
  ativo: boolean
}

export interface Task {
  id: number
  planoId: number
  modeloOrigemId: number
  titulo: string
  descricao: string | null
  status: TaskStatus
  prazo: string | null
  concluidaEm: string | null
}

export interface Preparation {
  id: number
  planoId: number
  idioma: string
  nivelAlvo: LanguageLevel
  dataMeta: string
  minutosSemanaisPlanejados: number
  status: PreparationStatus
}

export interface Proficiency {
  idioma: string
  nivel: LanguageLevel
}

export interface Profile {
  id?: number
  nascimento: string
  nacionalidades: string[]
  paisResidencia: string
  proficienciaIdioma: Proficiency[]
  situacaoEscolaridade: SchoolStatus
  nivelEscolaridade: EducationLevel
}

export interface Institution {
  id: number
  nome: string
  descricao: string | null
  siteOficial: string | null
}

export interface StudyArea {
  id: number
  nome: string
  descricao: string | null
}

export interface TaskTemplate {
  id: number
  titulo: string
  descricao: string | null
  categoria: TemplateCategory
  ativo: boolean
}

export const labels = {
  exchange: {
    GRADUACAO: "Graduação",
    POS_GRADUACAO: "Pós-graduação",
    CURSO_IDIOMA: "Curso de idioma",
    ENSINO_MEDIO: "Ensino médio",
    TRABALHO: "Trabalho",
  } satisfies Record<ExchangeType, string>,
  plan: {
    RASCUNHO: "Rascunho",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDO: "Concluído",
    CANCELADO: "Cancelado",
  } satisfies Record<PlanStatus, string>,
  task: {
    PENDENTE: "Pendente",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
  } satisfies Record<TaskStatus, string>,
  preparation: {
    NAO_INICIADA: "Não iniciada",
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
  } satisfies Record<PreparationStatus, string>,
  school: {
    CURSANDO: "Cursando",
    CONCLUIDO: "Concluído",
    INTERROMPIDO: "Interrompido",
  } satisfies Record<SchoolStatus, string>,
  education: {
    ENSINO_FUNDAMENTAL: "Ensino fundamental",
    ENSINO_MEDIO: "Ensino médio",
    GRADUACAO: "Graduação",
    POS_GRADUACAO: "Pós-graduação",
    MESTRADO: "Mestrado",
    DOUTORADO: "Doutorado",
  } satisfies Record<EducationLevel, string>,
  category: {
    DOCUMENTACAO: "Documentação",
    IDIOMA: "Idioma",
    FINANCEIRO: "Financeiro",
    INSCRICAO: "Inscrição",
    OUTROS: "Outros",
  } satisfies Record<TemplateCategory, string>,
}
