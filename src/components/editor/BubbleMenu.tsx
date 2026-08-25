'use client'

import { BubbleMenu as TiptapBubbleMenu } from '@tiptap/react'
import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Link2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  SquareCode,
} from 'lucide-react'

interface BubbleMenuProps {
  editor: Editor
}

export function BubbleMenu({ editor }: BubbleMenuProps) {
  return (
    <TiptapBubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <div className="flex items-center gap-0.5 px-1.5 py-1 bg-surface border border-border rounded-xl shadow-soft-lg animate-scale-in">
        <BubbleButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} label="Bold">
          <Bold size={14} />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} label="Italic">
          <Italic size={14} />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} label="Strikethrough">
          <Strikethrough size={14} />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} label="Inline code">
          <Code size={14} />
        </BubbleButton>
        <Separator />
        <BubbleButton
          onClick={() => {
            const url = prompt('URL:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          isActive={editor.isActive('link')}
          label="Link"
        >
          <Link2 size={14} />
        </BubbleButton>
        <Separator />
        <BubbleButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} label="Heading 1">
          <Heading1 size={14} />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} label="Heading 2">
          <Heading2 size={14} />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} label="Heading 3">
          <Heading3 size={14} />
        </BubbleButton>
        <Separator />
        <BubbleButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} label="Bullet list">
          <List size={14} />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} label="Numbered list">
          <ListOrdered size={14} />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} label="Task list">
          <ListChecks size={14} />
        </BubbleButton>
        <Separator />
        <BubbleButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} label="Code block">
          <SquareCode size={14} />
        </BubbleButton>
        <BubbleButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} label="Quote">
          <Quote size={14} />
        </BubbleButton>
      </div>
    </TiptapBubbleMenu>
  )
}

function BubbleButton({
  children,
  onClick,
  isActive,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  isActive: boolean
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      }`}
    >
      {children}
    </button>
  )
}

function Separator() {
  return <div className="w-px h-5 bg-border mx-1" />
}
