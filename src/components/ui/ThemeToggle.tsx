'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'

const OPTIONS = [
  { value: 'light' as const, icon: Sun, label: 'Light theme' },
  { value: 'system' as const, icon: Monitor, label: 'System theme' },
  { value: 'dark' as const, icon: Moon, label: 'Dark theme' },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-muted">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          title={label}
          className={`relative p-1.5 rounded-md transition-colors ${
            theme === value
              ? 'bg-surface text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}
