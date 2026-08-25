'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'

export type SaveStatus = 'idle' | 'saving' | 'saved'

export function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <div className="h-5 flex items-center">
      <AnimatePresence mode="wait">
        {status === 'saving' && (
          <motion.div
            key="saving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Loader2 size={12} className="animate-spin" />
            Saving…
          </motion.div>
        )}
        {status === 'saved' && (
          <motion.div
            key="saved"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs text-success"
          >
            <Check size={12} />
            Saved
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
