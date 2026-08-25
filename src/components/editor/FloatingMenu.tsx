'use client'

import { FloatingMenu as TiptapFloatingMenu } from '@tiptap/react'
import { Editor } from '@tiptap/react'
import { useState, useRef, useEffect } from 'react'
import { Heading1, Heading2, Heading3, List, ListOrdered, ListChecks, SquareCode, Table2, ImageIcon } from 'lucide-react'

interface FloatingMenuProps {
  editor: Editor
}

export function FloatingMenu({ editor }: FloatingMenuProps) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      const { state, view } = editor
      const { selection } = state
      const { empty, anchor } = selection

      if (empty) {
        const coords = view.coordsAtPos(anchor)
        const menuRect = menuRef.current?.getBoundingClientRect()
        const editorRect = view.dom.getBoundingClientRect()

        setPosition({
          top: coords.top - editorRect.top - (menuRect?.height || 40) - 8,
          left: coords.left - editorRect.left,
        })
        setShow(true)
      } else {
        setShow(false)
      }
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor])

  if (!show) return null

  return (
    <TiptapFloatingMenu editor={editor}>
      <div
        ref={menuRef}
        className="fixed z-50 flex items-center gap-0.5 px-1.5 py-1 bg-surface border border-border rounded-xl shadow-soft-lg animate-scale-in"
        style={{ top: position.top, left: position.left }}
      >
        <Button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
          <Heading1 size={14} />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
          <Heading2 size={14} />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
          <Heading3 size={14} />
        </Button>
        <Separator />
        <Button onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <List size={14} />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <ListOrdered size={14} />
        </Button>
        <Button onClick={() => editor.chain().focus().toggleTaskList().run()} title="Task list">
          <ListChecks size={14} />
        </Button>
        <Separator />
        <Button onClick={() => editor.chain().focus().toggleCodeBlock().run()} title="Code block">
          <SquareCode size={14} />
        </Button>
        <Button onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Table">
          <Table2 size={14} />
        </Button>
        <Separator />
        <Button onClick={() => editor.chain().focus().setImage({ src: prompt('Image URL:') || '' }).run()} title="Add image">
          <ImageIcon size={14} />
        </Button>
      </div>
    </TiptapFloatingMenu>
  )
}

function Button({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
    >
      {children}
    </button>
  )
}

function Separator() {
  return <div className="w-px h-5 bg-border mx-1" />
}
