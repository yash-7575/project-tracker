'use client'

import { useEditor, EditorContent, JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Heading from '@tiptap/extension-heading'
import Image from '@tiptap/extension-image'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Link from '@tiptap/extension-link'
import Blockquote from '@tiptap/extension-blockquote'
import HorizontalRule from '@tiptap/extension-horizontal-rule'
import Strike from '@tiptap/extension-strike'
import Placeholder from '@tiptap/extension-placeholder'
import { common, createLowlight } from 'lowlight'
import { useEffect, useRef, useState } from 'react'
import type { Page } from '@/types/database'
import { FloatingMenu } from './FloatingMenu'
import { BubbleMenu } from './BubbleMenu'
import { SlashMenu } from './SlashMenu'

const lowlight = createLowlight(common)

interface EditorProps {
  page: Page
  onUpdate: (content: Page['content']) => void
}

function getInitialContent(content: Page['content']): JSONContent {
  if (content && typeof content === 'object' && 'type' in content) {
    return content as JSONContent
  }
  return { type: 'doc', content: [] }
}

export function TiptapEditor({ page, onUpdate }: EditorProps) {
  const debounceRef = useRef<NodeJS.Timeout>()
  const [wordCount, setWordCount] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Heading.configure({ levels: [1, 2, 3] }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
      Blockquote,
      HorizontalRule,
      Strike,
      Placeholder.configure({
        placeholder: "Type '/' for commands, or just start writing…",
      }),
    ],
    content: getInitialContent(page.content),
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      setWordCount(countWords(editor.getText()))
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onUpdate(editor.getJSON())
      }, 500)
    },
  })

  useEffect(() => {
    if (editor) setWordCount(countWords(editor.getText()))
  }, [editor])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  if (!editor) return null

  return (
    <div className="flex-1 min-h-0">
      <div className="prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </div>
      <FloatingMenu editor={editor} />
      <BubbleMenu editor={editor} />
      <SlashMenu editor={editor} />

      <div className="mt-6 pt-3 border-t border-border/60 text-xs text-muted-foreground tabular-nums">
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </div>
    </div>
  )
}

function countWords(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}
