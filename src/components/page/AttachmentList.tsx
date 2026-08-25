'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileIcon, Trash2, ExternalLink } from 'lucide-react'
import { getAttachments, deleteAttachment } from '@/lib/attachments'
import { useToast } from '@/components/providers/ToastProvider'
import { useConfirm } from '@/components/providers/ConfirmProvider'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Attachment } from '@/types/database'

interface AttachmentListProps {
  pageId: string
  refreshKey?: number
}

export function AttachmentList({ pageId, refreshKey }: AttachmentListProps) {
  const { toast } = useToast()
  const confirm = useConfirm()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAttachments(pageId)
      .then((data) => {
        if (!cancelled) setAttachments(data)
      })
      .catch((error) => {
        console.error('Failed to fetch attachments:', error)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pageId, refreshKey])

  const handleDelete = async (attachment: Attachment) => {
    const ok = await confirm({
      title: `Delete "${attachment.file_name}"?`,
      description: 'This attachment will be permanently removed.',
      confirmText: 'Delete',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteAttachment(attachment.id)
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
      toast('Attachment deleted', 'success')
    } catch (error) {
      console.error('Failed to delete attachment:', error)
      toast('Failed to delete attachment', 'error')
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImage = (type: string | null) => type?.startsWith('image/') ?? false

  if (loading) {
    return (
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    )
  }

  if (attachments.length === 0) return null

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-foreground mb-2">
        Attachments <span className="text-muted-foreground font-normal">({attachments.length})</span>
      </h3>
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {attachments.map((attachment) => (
            <motion.div
              key={attachment.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0, transition: { duration: 0.15 } }}
              className="group flex items-center gap-3 p-2 rounded-lg border border-transparent hover:border-border hover:bg-accent/40 transition-colors"
            >
              {isImage(attachment.file_type) ? (
                <img
                  src={attachment.file_url}
                  alt={attachment.file_name}
                  className="w-10 h-10 object-cover rounded-md border border-border shrink-0"
                />
              ) : (
                <div className="w-10 h-10 flex items-center justify-center bg-muted rounded-md shrink-0">
                  <FileIcon size={16} className="text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{attachment.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {attachment.file_type || 'Unknown type'} · {formatFileSize(attachment.file_size)}
                </p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={attachment.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                  aria-label="Open attachment"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  onClick={() => handleDelete(attachment)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                  aria-label="Delete attachment"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
