'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Menu, Layers } from 'lucide-react'
import { getPageTree, getPage, createPage, updatePageContent, findPagePath } from '@/lib/pages'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { PageView } from '@/components/page/PageView'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { useToast } from '@/components/providers/ToastProvider'
import type { SaveStatus } from '@/components/ui/SaveIndicator'
import type { Page, PageWithChildren } from '@/types/database'

export default function HomePage() {
  const { toast } = useToast()
  const [pages, setPages] = useState<PageWithChildren[]>([])
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const savedTimeoutRef = useRef<NodeJS.Timeout>()
  const selectedPageIdRef = useRef<string | null>(null)

  useEffect(() => {
    selectedPageIdRef.current = selectedPageId
  }, [selectedPageId])

  const loadPageTree = useCallback(async () => {
    try {
      const tree = await getPageTree()
      setPages(tree)
      const currentId = selectedPageIdRef.current
      if (currentId && !findPagePath(tree, currentId)) {
        setSelectedPageId(null)
        setSelectedPage(null)
      }
    } catch (error) {
      console.error('Failed to load page tree:', error)
      toast('Failed to load pages', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadPageTree()
  }, [loadPageTree])

  const loadPage = useCallback(
    async (id: string) => {
      setSelectedPageId(id)
      setMobileSidebarOpen(false)
      try {
        const page = await getPage(id)
        setSelectedPage(page)
      } catch (error) {
        console.error('Failed to load page:', error)
        toast('Failed to load page', 'error')
      }
    },
    [toast]
  )

  const handleCreatePage = useCallback(
    async (parentId: string | null) => {
      try {
        const newPage = await createPage({ parentPageId: parentId, title: 'Untitled' })
        await loadPageTree()
        loadPage(newPage.id)
      } catch (error) {
        console.error('Failed to create page:', error)
        toast('Failed to create page', 'error')
      }
    },
    [loadPageTree, loadPage, toast]
  )

  const handleUpdateContent = useCallback(
    async (content: Page['content']) => {
      if (!selectedPage) return
      setSaveStatus('saving')
      try {
        await updatePageContent(selectedPage.id, content)
        setSaveStatus('saved')
        if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current)
        savedTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        console.error('Failed to save content:', error)
        setSaveStatus('idle')
        toast('Failed to save changes', 'error')
      }
    },
    [selectedPage, toast]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        handleCreatePage(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleCreatePage])

  return (
    <div className="flex h-dvh bg-background overflow-hidden">
      <Sidebar
        pages={pages}
        selectedPageId={selectedPageId}
        loading={loading}
        onSelectPage={loadPage}
        onCreatePage={handleCreatePage}
        onChanged={loadPageTree}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 h-14 px-4 border-b border-border shrink-0 lg:hidden">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:bg-accent transition-colors"
            aria-label="Open sidebar"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Layers size={14} className="text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              {selectedPage?.title || 'Notes'}
            </span>
          </div>
          <ThemeToggle />
        </div>

        <PageView
          page={selectedPage}
          pages={pages}
          saveStatus={saveStatus}
          onUpdateContent={handleUpdateContent}
          onCreateSubpage={() => selectedPageId && handleCreatePage(selectedPageId)}
          onSelectPage={loadPage}
          onChanged={loadPageTree}
        />
      </div>
    </div>
  )
}
