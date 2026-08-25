'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Search, X, Layers } from 'lucide-react'
import { PageWithChildren } from '@/types/database'
import { PageTreeItem } from './PageTreeItem'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Skeleton } from '@/components/ui/Skeleton'
import { countPages } from '@/lib/pages'

interface SidebarProps {
  pages: PageWithChildren[]
  selectedPageId: string | null
  loading: boolean
  onSelectPage: (id: string) => void
  onCreatePage: (parentId: string | null) => void
  onChanged: () => void
  isMobileOpen: boolean
  onCloseMobile: () => void
}

function filterTree(tree: PageWithChildren[], query: string): PageWithChildren[] {
  const q = query.toLowerCase()
  return tree.reduce<PageWithChildren[]>((acc, page) => {
    const children = filterTree(page.children, query)
    const matches = page.title.toLowerCase().includes(q)
    if (matches || children.length > 0) {
      acc.push({ ...page, children })
    }
    return acc
  }, [])
}

function collectIds(tree: PageWithChildren[]): string[] {
  return tree.flatMap((page) => [page.id, ...collectIds(page.children)])
}

export function Sidebar({
  pages,
  selectedPageId,
  loading,
  onSelectPage,
  onCreatePage,
  onChanged,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const visibleTree = useMemo(() => {
    if (!query.trim()) return pages
    return filterTree(pages, query.trim())
  }, [pages, query])

  const searchExpandedIds = useMemo(() => {
    if (!query.trim()) return expandedIds
    return new Set([...expandedIds, ...collectIds(visibleTree)])
  }, [query, expandedIds, visibleTree])

  const totalPages = useMemo(() => countPages(pages), [pages])

  return (
    <>
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCloseMobile}
            className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[1px] lg:hidden"
          />
        )}
      </AnimatePresence>

      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 flex flex-col h-full bg-muted/60 border-r border-border transition-transform duration-200 ease-out lg:static lg:translate-x-0 lg:z-0 ${
          isMobileOpen ? 'translate-x-0 shadow-soft-xl' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-4 h-14 shrink-0 border-b border-border">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Layers size={15} />
          </div>
          <h1 className="text-sm font-semibold text-foreground truncate">Notes</h1>
          <button
            onClick={onCloseMobile}
            className="ml-auto p-1.5 rounded-md text-muted-foreground hover:bg-accent lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-3 pt-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages…"
              className="w-full pl-8 pr-7 py-1.5 text-sm rounded-lg bg-surface border border-border outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-shadow placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 py-3">
          {loading ? (
            <div className="space-y-1.5 px-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" style={{ animationDelay: `${i * 60}ms` } as React.CSSProperties} />
              ))}
            </div>
          ) : (
            <ul className="space-y-0.5" role="tree">
              {visibleTree.map((page) => (
                <PageTreeItem
                  key={page.id}
                  page={page}
                  depth={0}
                  selectedPageId={selectedPageId}
                  expandedIds={searchExpandedIds}
                  onToggleExpand={toggleExpand}
                  onSelect={onSelectPage}
                  onChanged={onChanged}
                />
              ))}
            </ul>
          )}

          {!loading && pages.length === 0 && (
            <div className="flex flex-col items-center text-center py-12 px-4 animate-fade-in-up">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <FileText size={20} className="text-primary" />
              </div>
              <p className="text-sm font-medium text-foreground">No pages yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">Create your first page to get started</p>
              <button
                onClick={() => onCreatePage(null)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create a page
              </button>
            </div>
          )}

          {!loading && pages.length > 0 && visibleTree.length === 0 && (
            <div className="text-center py-10 px-4 text-sm text-muted-foreground animate-fade-in">
              No pages match &ldquo;{query}&rdquo;
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border shrink-0 space-y-2.5">
          <button
            onClick={() => onCreatePage(null)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-accent hover:border-primary/30 active:scale-[0.98] transition-all"
          >
            <Plus size={15} />
            New Page
          </button>
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {totalPages} {totalPages === 1 ? 'page' : 'pages'}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  )
}
