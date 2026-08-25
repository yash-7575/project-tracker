'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, ImagePlus, X, Plus, Sparkles } from 'lucide-react'
import { Page, PageWithChildren } from '@/types/database'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { AttachmentUploader } from './AttachmentUploader'
import { AttachmentList } from './AttachmentList'
import { renamePage, updatePageIcon, updatePageCover, findPagePath } from '@/lib/pages'
import { EmojiPicker } from '@/components/ui/EmojiPicker'
import { SaveIndicator, SaveStatus } from '@/components/ui/SaveIndicator'
import { useToast } from '@/components/providers/ToastProvider'

interface PageViewProps {
  page: Page | null
  pages: PageWithChildren[]
  saveStatus: SaveStatus
  onUpdateContent: (content: Page['content']) => void
  onCreateSubpage: () => void
  onSelectPage: (id: string) => void
  onChanged: () => void
}

export function PageView({
  page,
  pages,
  saveStatus,
  onUpdateContent,
  onCreateSubpage,
  onSelectPage,
  onChanged,
}: PageViewProps) {
  const { toast } = useToast()
  const [title, setTitle] = useState(page?.title || '')
  const [coverImage, setCoverImage] = useState(page?.cover_image || '')
  const [icon, setIcon] = useState(page?.icon || '📄')
  const [showCoverInput, setShowCoverInput] = useState(false)
  const [coverDraft, setCoverDraft] = useState('')
  const [attachmentsVersion, setAttachmentsVersion] = useState(0)
  const debounceRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (page) {
      setTitle(page.title)
      setCoverImage(page.cover_image || '')
      setIcon(page.icon || '📄')
      setShowCoverInput(false)
    }
  }, [page?.id])

  const handleTitleChange = useCallback(
    (newTitle: string) => {
      setTitle(newTitle)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(async () => {
        if (page && newTitle !== page.title) {
          try {
            await renamePage(page.id, newTitle || 'Untitled')
            onChanged()
          } catch (error) {
            console.error('Failed to rename page:', error)
            toast('Failed to save title', 'error')
          }
        }
      }, 500)
    },
    [page, onChanged, toast]
  )

  const handleIconChange = useCallback(
    async (newIcon: string) => {
      setIcon(newIcon)
      if (page) {
        try {
          await updatePageIcon(page.id, newIcon)
          onChanged()
        } catch (error) {
          console.error('Failed to update icon:', error)
          toast('Failed to save icon', 'error')
        }
      }
    },
    [page, onChanged, toast]
  )

  const handleSetCover = useCallback(
    async (url: string) => {
      if (!page) return
      setCoverImage(url)
      setShowCoverInput(false)
      try {
        await updatePageCover(page.id, url || null)
      } catch (error) {
        console.error('Failed to update cover:', error)
        toast('Failed to save cover image', 'error')
      }
    },
    [page, toast]
  )

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-sm"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Sparkles className="text-primary" size={24} />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Nothing selected</h2>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Choose a page from the sidebar, or create a new one to start writing.
          </p>
        </motion.div>
      </div>
    )
  }

  const path = findPagePath(pages, page.id) || [page as PageWithChildren]
  const ancestors = path.slice(0, -1)

  return (
    <div className="flex-1 flex flex-col bg-background overflow-y-auto scrollbar-thin">
      <motion.div
        key={page.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col flex-1"
      >
        {coverImage && (
          <div className="relative h-44 sm:h-56 w-full overflow-hidden group/cover shrink-0">
            <img src={coverImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
            <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover/cover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  setCoverDraft(coverImage)
                  setShowCoverInput(true)
                }}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-surface/90 backdrop-blur border border-border shadow-soft hover:bg-surface transition-colors"
              >
                Change
              </button>
              <button
                onClick={() => handleSetCover('')}
                className="p-1.5 rounded-lg bg-surface/90 backdrop-blur border border-border shadow-soft hover:bg-danger/10 hover:text-danger transition-colors"
                aria-label="Remove cover"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-3xl w-full mx-auto px-6 sm:px-10 pt-8">
          {/* Breadcrumbs */}
          {ancestors.length > 0 && (
            <nav className="flex items-center flex-wrap gap-1 text-sm text-muted-foreground mb-4 -mt-1">
              {ancestors.map((ancestor) => (
                <span key={ancestor.id} className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectPage(ancestor.id)}
                    className="hover:text-foreground transition-colors truncate max-w-[10rem]"
                  >
                    {ancestor.icon || '📄'} {ancestor.title || 'Untitled'}
                  </button>
                  <ChevronRight size={13} className="shrink-0" />
                </span>
              ))}
              <span className="text-foreground/70 truncate max-w-[10rem]">{icon} {title || 'Untitled'}</span>
            </nav>
          )}

          <div className="flex items-start gap-3">
            <EmojiPicker value={icon} onChange={handleIconChange} />

            <div className="flex-1 min-w-0 pt-1">
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Untitled"
                className="w-full text-3xl sm:text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 tracking-tight"
              />
              <div className="flex items-center gap-3 mt-1.5 h-5">
                <SaveIndicator status={saveStatus} />
              </div>
            </div>

            <button
              onClick={onCreateSubpage}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 mt-1 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-accent hover:border-primary/30 active:scale-[0.98] transition-all shrink-0"
            >
              <Plus size={15} />
              Subpage
            </button>
          </div>

          {!coverImage && !showCoverInput && (
            <button
              onClick={() => {
                setCoverDraft('')
                setShowCoverInput(true)
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ImagePlus size={13} />
              Add cover image
            </button>
          )}

          {showCoverInput && (
            <div className="mt-3 flex items-center gap-2 animate-fade-in-up">
              <input
                type="url"
                value={coverDraft}
                onChange={(e) => setCoverDraft(e.target.value)}
                placeholder="Paste an image URL…"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSetCover(coverDraft)}
                className="flex-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={() => handleSetCover(coverDraft)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowCoverInput(false)}
                className="px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          <button
            onClick={onCreateSubpage}
            className="sm:hidden mt-4 flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-accent transition-colors"
          >
            <Plus size={15} />
            New subpage
          </button>
        </div>

        {/* Editor */}
        <div className="max-w-3xl w-full mx-auto px-6 sm:px-10 pb-10 pt-6 flex-1">
          <TiptapEditor page={page} onUpdate={onUpdateContent} />
        </div>

        {/* Attachments */}
        <div className="max-w-3xl w-full mx-auto px-6 sm:px-10 pb-10 border-t border-border pt-6">
          <AttachmentUploader pageId={page.id} onUploaded={() => setAttachmentsVersion((v) => v + 1)} />
          <AttachmentList pageId={page.id} refreshKey={attachmentsVersion} />
        </div>
      </motion.div>
    </div>
  )
}
