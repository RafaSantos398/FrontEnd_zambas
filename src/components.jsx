const paths = {
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10M9 20v-6h6v6" />
    </>
  ),

  plans: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </>
  ),

  course: (
    <>
      <path d="m3 10 9-5 9 5-9 5-9-5Z" />
      <path d="M7 12v5c3 2 7 2 10 0v-5M21 10v6" />
    </>
  ),

  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.8-4 3.5-6 8-6s7.2 2 8 6" />
    </>
  ),

  admin: (
    <>
      <path d="M12 3 4 7v5c0 5 3.4 8 8 9 4.6-1 8-4 8-9V7l-8-4Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),

  plus: <path d="M12 5v14M5 12h14" />,

  arrow: <path d="m9 18 6-6-6-6" />,

  check: <path d="m5 12 4 4L19 6" />,

  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),

  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),

  logout: (
    <>
      <path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10" />
    </>
  ),

  menu: <path d="M4 7h16M4 12h16M4 17h16" />,

  close: <path d="m6 6 12 12M18 6 6 18" />,

  warning: (
    <>
      <path d="M12 3 2.8 20h18.4L12 3Z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  ),

  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
      <path d="M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14" />
      <path d="M21 19v-5h-5" />
    </>
  ),

  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),

  edit: (
    <>
      <path d="m14 5 5 5M4 20l3.5-.7L19 7.8 16.2 5 4.7 16.5 4 20Z" />
    </>
  ),
}

export function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export function Logo({ light = false }) {
  return (
    <img
      className={`logo ${light ? "logo-light" : ""}`}
      src="/berxy-logo.png"
      alt="Berxy"
    />
  )
}

export function Bear({ className = "" }) {
  return (
    <svg
      className={`bear ${className}`}
      viewBox="0 0 260 260"
      role="img"
      aria-label="Urso Berxy com mochila e mapa"
    >
      <circle
        cx="71"
        cy="62"
        r="33"
        fill="#ede9fe"
        stroke="#3b0764"
        strokeWidth="7"
      />
      <circle
        cx="189"
        cy="62"
        r="33"
        fill="#ede9fe"
        stroke="#3b0764"
        strokeWidth="7"
      />
      <path
        d="M43 177c0-79 28-130 87-130s87 51 87 130c0 49-34 72-87 72s-87-23-87-72Z"
        fill="#fff"
        stroke="#3b0764"
        strokeWidth="7"
      />
      <path
        d="M196 126c27 7 39 29 34 64l-39-7Z"
        fill="#6d28d9"
        stroke="#3b0764"
        strokeWidth="7"
      />
      <circle cx="99" cy="110" r="7" fill="#241b35" />
      <circle cx="163" cy="110" r="7" fill="#241b35" />
      <ellipse cx="131" cy="137" rx="28" ry="23" fill="#ede9fe" />
      <ellipse cx="131" cy="130" rx="10" ry="7" fill="#241b35" />
      <path
        d="M131 137c0 9-8 13-17 10M131 137c0 9 8 13 17 10"
        fill="none"
        stroke="#241b35"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M70 172c20-10 38-10 58 1l-14 56-52-16Z"
        fill="#faf8ff"
        stroke="#3b0764"
        strokeWidth="6"
      />
      <path
        d="m76 181 19 12 25-12M95 193v27"
        fill="none"
        stroke="#6d28d9"
        strokeWidth="5"
      />
      <path
        d="M180 178c-15-6-30-4-44 9"
        fill="none"
        stroke="#3b0764"
        strokeWidth="12"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function Button({
  variant = "primary",

  icon,

  children,

  className = "",

  ...props
}) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}

export function StatusBadge({ label, status }) {
  const kind = status.includes("CONCLUID")
    ? "success"
    : status === "EM_ANDAMENTO"
      ? "progress"
      : status === "CANCELADO"
        ? "danger"
        : "neutral"

  return (
    <span className={`status status-${kind}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  )
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="empty">
      <Bear className="empty-bear" />
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
        {action}
      </div>
    </div>
  )
}

export function Notice({ kind = "error", children }) {
  return (
    <div
      className={`notice notice-${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      <Icon
        name={
          kind === "success" ? "check" : kind === "error" ? "warning" : "clock"
        }
      />{" "}
      <span>{children}</span>
    </div>
  )
}

export function Spinner({ label = "Carregando" }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  )
}
