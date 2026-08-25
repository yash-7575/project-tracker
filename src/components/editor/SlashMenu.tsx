'use client'

import { useEffect, useRef, useState } from 'react'
import { Editor } from '@tiptap/react'
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  SquareCode,
  Table2,
  Quote,
  Minus,
  ImageIcon,
} from 'lucide-react'

interface SlashMenuProps {
  editor: Editor
}

const slashMenuItems = [
  { title: 'Heading 1', command: ({ editor }: { editor: Editor }) => editor.chain().focus().toggleHeading({ level: 1 }).run(), icon: Heading1 },
  { title: 'Heading 2', command: ({ editor }: { editor: Editor }) => editor.chain().focus().toggleHeading({ level: 2 }).run(), icon: Heading2 },
  { title: 'Heading 3', command: ({ editor }: { editor: Editor }) => editor.chain().focus().toggleHeading({ level: 3 }).run(), icon: Heading3 },
  { title: 'Bullet List', command: ({ editor }: { editor: Editor }) => editor.chain().focus().toggleBulletList().run(), icon: List },
  { title: 'Numbered List', command: ({ editor }: { editor: Editor }) => editor.chain().focus().toggleOrderedList().run(), icon: ListOrdered },
  { title: 'Task List', command: ({ editor }: { editor: Editor }) => editor.chain().focus().toggleTaskList().run(), icon: ListChecks },
  { title: 'Code Block', command: ({ editor }: { editor: Editor }) => editor.chain().focus().toggleCodeBlock().run(), icon: SquareCode },
  { title: 'Table', command: ({ editor }: { editor: Editor }) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), icon: Table2 },
  { title: 'Blockquote', command: ({ editor }: { editor: Editor }) => editor.chain().focus().toggleBlockquote().run(), icon: Quote },
  { title: 'Horizontal Rule', command: ({ editor }: { editor: Editor }) => editor.chain().focus().setHorizontalRule().run(), icon: Minus },
  { title: 'Image', command: ({ editor }: { editor: Editor }) => editor.chain().focus().setImage({ src: prompt('Image URL:') || '' }).run(), icon: ImageIcon },
]

export function SlashMenu({ editor }: SlashMenuProps) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [filteredItems, setFilteredItems] = useState(slashMenuItems)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const queryRef = useRef('')

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      const { state, view } = editor
      const { selection } = state
      const { empty, anchor } = selection

      if (empty) {
        const textBefore = state.doc.textBetween(Math.max(0, anchor - 50), anchor, null, '￼')
        const slashMatch = textBefore.match(/\/([a-z]*)$/)

        if (slashMatch) {
          queryRef.current = slashMatch[1]
          const filtered = slashMenuItems.filter((item) =>
            item.title.toLowerCase().startsWith(slashMatch[1].toLowerCase())
          )

          if (filtered.length > 0) {
            setFilteredItems(filtered)
            setSelectedIndex(0)

            const coords = view.coordsAtPos(anchor)
            const editorRect = view.dom.getBoundingClientRect()

            setPosition({
              top: coords.top - editorRect.top + 22,
              left: coords.left - editorRect.left,
            })
            setShow(true)
            return
          }
        }
      }
      setShow(false)
    }

    editor.on('selectionUpdate', handleSelectionUpdate)
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate)
    }
  }, [editor])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!show) return

      if (e.key === 'Escape') {
        e.preventDefault()
        setShow(false)
        queryRef.current = ''
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        const item = filteredItems[selectedIndex]
        if (item) {
          item.command({ editor })
          const { state } = editor
          const { selection } = state
          const { anchor } = selection
          const textBefore = state.doc.textBetween(Math.max(0, anchor - 50), anchor, null, '￼')
          const slashMatch = textBefore.match(/\/([a-z]*)$/)
          if (slashMatch) {
            editor.chain().focus().deleteRange({ from: anchor - slashMatch[0].length, to: anchor }).run()
          }
          setShow(false)
          queryRef.current = ''
        }
        return
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        queryRef.current += e.key
        const filtered = slashMenuItems.filter((item) =>
          item.title.toLowerCase().startsWith(queryRef.current.toLowerCase())
        )
        setFilteredItems(filtered)
        setSelectedIndex(0)
      } else if (e.key === 'Backspace') {
        queryRef.current = queryRef.current.slice(0, -1)
        const filtered = slashMenuItems.filter((item) =>
          item.title.toLowerCase().startsWith(queryRef.current.toLowerCase())
        )
        setFilteredItems(filtered)
        setSelectedIndex(0)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [show, editor, filteredItems, selectedIndex])

  if (!show || filteredItems.length === 0) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-56 bg-surface border border-border rounded-xl shadow-soft-lg py-1.5 animate-scale-in"
      style={{ top: position.top, left: position.left }}
    >
      {filteredItems.map((item, index) => {
        const Icon = item.icon
        return (
          <div
            key={item.title}
            className={`mx-1.5 px-2 py-1.5 rounded-lg text-sm cursor-pointer flex items-center gap-2.5 transition-colors ${
              index === selectedIndex ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-accent'
            }`}
          >
            <span className={`flex items-center justify-center w-6 h-6 rounded-md shrink-0 ${
              index === selectedIndex ? 'bg-primary/10' : 'bg-muted'
            }`}>
              <Icon size={13} />
            </span>
            {item.title}
          </div>
        )
      })}
    </div>
  )
}
