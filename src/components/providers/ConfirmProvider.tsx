'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

interface ConfirmOptions {
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolveRef = useRef<(value: boolean) => void>()

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts)
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve
    })
  }, [])

  const handle = useCallback((result: boolean) => {
    resolveRef.current?.(result)
    setOptions(null)
  }, [])

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {options && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-foreground/20 backdrop-blur-[2px] p-4"
            onClick={() => handle(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 4 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-border bg-surface shadow-soft-xl p-5"
              role="alertdialog"
              aria-modal="true"
            >
              <div className="flex items-start gap-3">
                {options.danger && (
                  <div className="shrink-0 w-9 h-9 rounded-full bg-danger/10 flex items-center justify-center">
                    <AlertTriangle size={17} className="text-danger" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{options.title}</h3>
                  {options.description && (
                    <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{options.description}</p>
                  )}
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => handle(false)}
                  className="px-3.5 py-1.5 text-sm font-medium rounded-lg text-foreground hover:bg-accent transition-colors"
                >
                  {options.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={() => handle(true)}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-lg text-white transition-colors ${
                    options.danger ? 'bg-danger hover:bg-danger/90' : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {options.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
