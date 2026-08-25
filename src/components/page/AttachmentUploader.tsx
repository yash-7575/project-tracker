'use client'

import { useState, useCallback, useRef } from 'react'
import { UploadCloud, Loader2 } from 'lucide-react'
import { uploadAttachment } from '@/lib/attachments'
import { useToast } from '@/components/providers/ToastProvider'

interface AttachmentUploaderProps {
  pageId: string
  onUploaded?: () => void
}

export function AttachmentUploader({ pageId, onUploaded }: AttachmentUploaderProps) {
  const { toast } = useToast()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (files.length === 0) return
      setIsUploading(true)
      let failures = 0
      for (const file of Array.from(files)) {
        try {
          await uploadAttachment(pageId, file)
        } catch (error) {
          console.error('Upload failed:', error)
          failures++
        }
      }
      setIsUploading(false)
      if (failures > 0) {
        toast(`Failed to upload ${failures} file${failures > 1 ? 's' : ''}`, 'error')
      } else {
        toast(files.length > 1 ? `${files.length} files uploaded` : 'File uploaded', 'success')
      }
      onUploaded?.()
    },
    [pageId, toast, onUploaded]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files!)
      e.target.value = ''
    },
    [handleFiles]
  )

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={`relative border border-dashed rounded-xl p-5 cursor-pointer transition-all ${
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.01]'
          : 'border-border hover:border-primary/40 hover:bg-accent/40'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleChange}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label="Upload files"
      />

      <div className="flex flex-col items-center text-center pointer-events-none">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 transition-colors ${isDragging ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {isUploading ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
        </div>
        <p className="text-sm text-foreground/80 font-medium">
          {isUploading ? 'Uploading…' : isDragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Images, PDFs, and other files</p>
      </div>
    </div>
  )
}
