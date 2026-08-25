'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const EMOJI_OPTIONS = [
  '📄', '📝', '📋', '📌', '📁', '📂', '🗂️', '📚',
  '💡', '🎯', '🚀', '✅', '⭐', '🔥', '💬', '📊',
  '🧠', '🛠️', '📅', '🔖', '❤️', '🎨', '🌱', '⚡',
]

export function EmojiPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (emoji: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (open && !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-4xl leading-none rounded-xl p-1.5 -m-1.5 hover:bg-accent transition-colors"
        aria-label="Change page icon"
      >
        {value}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.14 }}
            className="absolute z-30 top-full mt-2 left-0 w-64 p-2 grid grid-cols-8 gap-1 bg-surface border border-border rounded-xl shadow-soft-xl"
          >
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onChange(emoji)
                  setOpen(false)
                }}
                className={`text-lg rounded-lg p-1.5 hover:bg-accent transition-colors ${
                  emoji === value ? 'bg-primary/10' : ''
                }`}
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
