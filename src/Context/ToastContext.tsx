import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { AlertTriangle, CheckCircle2, X } from "lucide-react"

type Toast = {
  id: number
  message: string
  variant: "error" | "success"
}

type ToastContextType = {
  showError: (message: string) => void
  showSuccess: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let nextId = 1

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback(
    (message: string, variant: Toast["variant"]) => {
      const id = nextId++
      setToasts(prev => [...prev, { id, message, variant }])
      window.setTimeout(() => dismiss(id), 5000)
    },
    [dismiss]
  )

  const showError = useCallback((message: string) => push(message, "error"), [push])
  const showSuccess = useCallback((message: string) => push(message, "success"), [push])

  return (
    <ToastContext.Provider value={{ showError, showSuccess }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-toast-in ${
              t.variant === "error"
                ? "bg-rose-50/95 border-rose-200 text-rose-800"
                : "bg-emerald-50/95 border-emerald-200 text-emerald-800"
            }`}
          >
            {t.variant === "error" ? (
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            )}
            <p className="text-sm flex-1">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}