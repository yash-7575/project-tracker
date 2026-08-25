'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronRight, Pencil, Plus, MoreHorizontal, Trash2, FilePlus } from 'lucide-react'
import { PageWithChildren } from '@/types/database'
import { renamePage, reorderPage, deletePage, createPage } from '@/lib/pages'
import { useToast } from '@/components/providers/ToastProvider'
import { useConfirm } from '@/components/providers/ConfirmProvider'

interface PageTreeItemProps {
  page: PageWithChildren
  depth: number
  selectedPageId: string | null
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onSelect: (id: string) => void
  onChanged: () => void
}

export function PageTreeItem({
  page,
  depth,
  selectedPageId,
  expandedIds,
  onToggleExpand,
  onSelect,
  onChanged,
}: PageTreeItemProps) {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [isDragging, setIsDragging] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(page.title)
  const itemRef = useRef<HTMLLIElement>(null)

  const isSelected = page.id === selectedPageId
  const isExpanded = expandedIds.has(page.id)
  const hasChildren = page.children.length > 0

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showContextMenu && !itemRef.current?.contains(e.target as Node)) {
        setShowContextMenu(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showContextMenu])

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      setIsDragging(true)
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', page.id)
    },
    [page.id]
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      const draggedId = e.dataTransfer.getData('text/plain')
      if (draggedId && draggedId !== page.id) {
        try {
          await reorderPage(draggedId, page.position + 1, page.parent_page_id)
          onChanged()
        } catch (error) {
          console.error('Failed to move page:', error)
          toast('Failed to move page', 'error')
        }
      }
    },
    [page.id, page.position, page.parent_page_id, onChanged, toast]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setShowContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleRename = useCallback(async () => {
    setIsRenaming(false)
    setShowContextMenu(null)
    if (renameValue.trim() && renameValue !== page.title) {
      try {
        await renamePage(page.id, renameValue.trim())
        onChanged()
      } catch (error) {
        console.error('Failed to rename page:', error)
        toast('Failed to rename page', 'error')
      }
    }
  }, [page.id, page.title, renameValue, onChanged, toast])

  const handleCreateSubpage = useCallback(async () => {
    setShowContextMenu(null)
    try {
      await createPage({ parentPageId: page.id, title: 'Untitled' })
      if (!isExpanded) onToggleExpand(page.id)
      onChanged()
    } catch (error) {
      console.error('Failed to create subpage:', error)
      toast('Failed to create subpage', 'error')
    }
  }, [page.id, isExpanded, onToggleExpand, onChanged, toast])

  const handleDelete = useCallback(async () => {
    setShowContextMenu(null)
    const ok = await confirm({
      title: `Delete "${page.title || 'Untitled'}"?`,
      description: hasChildren
        ? 'This page and all of its subpages will be permanently deleted.'
        : 'This page will be permanently deleted.',
      confirmText: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await deletePage(page.id)
      onChanged()
      toast('Page deleted', 'success')
    } catch (error) {
      console.error('Failed to delete page:', error)
      toast('Failed to delete page', 'error')
    }
  }, [page.id, page.title, hasChildren, confirm, onChanged, toast])

  return (
    <>
      <li
        ref={itemRef}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onContextMenu={handleContextMenu}
        onClick={(e) => {
          e.stopPropagation()
          onSelect(page.id)
        }}
        style={{ paddingLeft: depth * 14 }}
        className={`group relative flex items-center gap-1 pr-1.5 py-1.5 rounded-lg cursor-pointer transition-colors duration-100 ${
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'text-foreground/80 hover:bg-accent'
        } ${isDragging ? 'opacity-40' : ''} ${isDragOver ? 'ring-2 ring-primary/50' : ''}`}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={hasChildren ? isExpanded : undefined}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggleExpand(page.id)
          }}
          className={`p-0.5 rounded text-muted-foreground hover:text-foreground shrink-0 transition-opacity ${
            hasChildren ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          tabIndex={hasChildren ? 0 : -1}
        >
          <motion.span
            className="flex"
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
          >
            <ChevronRight size={14} />
          </motion.span>
        </button>

        {isRenaming ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRename}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') setIsRenaming(false)
            }}
            autoFocus
            className="flex-1 px-1.5 py-0.5 text-sm rounded bg-surface border border-primary/50 outline-none ring-2 ring-primary/20 min-w-0"
          />
        ) : (
          <span className="flex-1 truncate text-sm font-medium min-w-0 flex items-center gap-1.5">
            <span className="shrink-0">{page.icon || '📄'}</span>
            <span className="truncate">{page.title || 'Untitled'}</span>
          </span>
        )}

        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 flex items-center gap-0.5 shrink-0">
          <IconButton
            label="Add subpage"
            onClick={(e) => {
              e.stopPropagation()
              handleCreateSubpage()
            }}
          >
            <Plus size={14} />
          </IconButton>
          <IconButton
            label="More options"
            onClick={(e) => {
              e.stopPropagation()
              setShowContextMenu({ x: e.clientX, y: e.clientY })
            }}
          >
            <MoreHorizontal size={14} />
          </IconButton>
        </div>
      </li>

      <AnimatePresence initial={false}>
        {hasChildren && isExpanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
            role="group"
          >
            {page.children.map((child) => (
              <PageTreeItem
                key={child.id}
                page={child}
                depth={depth + 1}
                selectedPageId={selectedPageId}
                expandedIds={expandedIds}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                onChanged={onChanged}
              />
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showContextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 bg-surface border border-border rounded-lg shadow-soft-lg py-1 min-w-[170px]"
            style={{ left: showContextMenu.x, top: showContextMenu.y }}
            role="menu"
          >
            <MenuItem
              icon={<Pencil size={14} />}
              onClick={() => {
                setIsRenaming(true)
                setRenameValue(page.title)
                setShowContextMenu(null)
              }}
            >
              Rename
            </MenuItem>
            <MenuItem icon={<FilePlus size={14} />} onClick={handleCreateSubpage}>
              New subpage
            </MenuItem>
            <div className="my-1 border-t border-border" />
            <MenuItem icon={<Trash2 size={14} />} onClick={handleDelete} danger>
              Delete
            </MenuItem>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
      aria-label={label}
    >
      {children}
    </button>
  )
}

function MenuItem({
  children,
  icon,
  onClick,
  danger,
}: {
  children: React.ReactNode
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 transition-colors ${
        danger ? 'text-danger hover:bg-danger/10' : 'text-foreground hover:bg-accent'
      }`}
      role="menuitem"
    >
      {icon}
      {children}
    </button>
  )
}
