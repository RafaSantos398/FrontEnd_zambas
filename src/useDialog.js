import { useEffect, useRef } from "react"

export function useDialog(onClose, open = true) {
  const ref = useRef(null)

  const close = useRef(onClose)

  close.current = onClose

  useEffect(() => {
    if (!open || !ref.current) return

    const previous = document.activeElement

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"

    const elements = () => [
      ...ref.current.querySelectorAll(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
      ),
    ]
    ;(
      ref.current.querySelector("input, select, textarea") || elements()[0]
    )?.focus()

    function onKey(event) {
      if (event.key === "Escape") {
        event.preventDefault()
        close.current()
      }

      if (event.key !== "Tab") return

      const items = elements()

      const first = items[0]

      const last = items.at(-1)

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }

    document.addEventListener("keydown", onKey)

    return () => {
      document.removeEventListener("keydown", onKey)

      document.body.style.overflow = previousOverflow

      if (previous?.isConnected) previous.focus()
    }
  }, [open])

  return ref
}
