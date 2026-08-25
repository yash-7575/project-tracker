# Notetaking App

A Notion-style notetaking application built with Next.js, Tiptap, and Supabase.

## Features

- **Nested Pages**: Infinite nesting via parent-child relationships
- **Rich Text Editor**: Tiptap with headings, lists, checklists, code blocks, tables, images
- **Auto-save**: Debounced autosave (~500ms) to Supabase
- **Drag & Drop**: Reorder pages in sidebar, drag-and-drop file uploads
- **Attachments**: Upload images and files to Supabase Storage
- **Dark Mode**: Automatic dark/light theme support

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Editor**: Tiptap (@tiptap/react, @tiptap/starter-kit, extensions)
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Storage**: Supabase Storage (public `attachments` bucket)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account (or local Supabase CLI)

### 1. Clone and Install

```bash
git clone <your-repo>
cd project-tracker
npm install
```

### 2. Set up Supabase

#### Option A: Local Development (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase stack
supabase start

# Apply migrations
supabase db reset
```

This creates a local Supabase instance at `http://localhost:54321` with Studio at `http://localhost:54323`.

#### Option B: Remote Supabase Project

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your Project URL and anon key
3. Run the migration SQL in the SQL Editor:
   ```sql
   -- Copy contents of supabase/migrations/001_init.sql
   ```

4. Create a public Storage bucket named `attachments`:
   - Go to Storage → Create bucket
   - Name: `attachments`
   - Public bucket: ✓

### 3. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

For local development:
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Global styles + Tailwind
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page (sidebar + editor)
├── components/
│   ├── editor/
│   │   ├── TiptapEditor.tsx # Main editor component
│   │   ├── FloatingMenu.tsx # Floating toolbar on empty line
│   │   ├── BubbleMenu.tsx   # Bubble menu on text selection
│   │   └── SlashMenu.tsx    # Slash command menu
│   ├── sidebar/
│   │   ├── Sidebar.tsx      # Sidebar container
│   │   └── PageTreeItem.tsx # Recursive page tree item
│   └── page/
│       ├── PageView.tsx     # Page header + editor + attachments
│       ├── AttachmentUploader.tsx
│       └── AttachmentList.tsx
├── lib/
│   ├── supabase.ts          # Typed Supabase client
│   ├── pages.ts             # Page CRUD operations
│   └── attachments.ts       # Attachment operations
└── types/
    └── database.ts          # Generated TypeScript types
```

## Database Schema

```sql
-- Pages table (nested via parent_page_id)
create table pages (
  id uuid primary key default uuid_generate_v4(),
  parent_page_id uuid references pages(id) on delete cascade,
  title text not null default 'Untitled',
  icon text,
  cover_image text,
  content jsonb not null default '{}'::jsonb,
  position integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Attachments table
create table attachments (
  id uuid primary key default uuid_generate_v4(),
  page_id uuid not null references pages(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);
```

## Editor Extensions

- **StarterKit**: Basic formatting (bold, italic, strike, code, links, etc.)
- **Heading**: H1, H2, H3
- **BulletList/OrderedList**: Lists
- **TaskList/TaskItem**: Checklists
- **Image**: Image embedding (with base64 support)
- **CodeBlockLowlight**: Syntax-highlighted code blocks
- **Table**: Tables with resizable columns

## Future Phases (Not Implemented)

- Authentication & RLS
- Real-time collaboration
- Project management features
- Gamification
- AI assistant

## License

MIT