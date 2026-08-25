import { supabase } from './supabase'
import type { Page, PageInsert, PageUpdate, PageWithChildren } from '@/types/database'

function buildPageTree(pages: Page[], parentId: string | null = null): PageWithChildren[] {
  return pages
    .filter((page) => page.parent_page_id === parentId)
    .sort((a, b) => a.position - b.position)
    .map((page) => ({
      ...page,
      children: buildPageTree(pages, page.id),
    }))
}

export function findPagePath(tree: PageWithChildren[], id: string): PageWithChildren[] | null {
  for (const page of tree) {
    if (page.id === id) return [page]
    const childPath = findPagePath(page.children, id)
    if (childPath) return [page, ...childPath]
  }
  return null
}

export function countPages(tree: PageWithChildren[]): number {
  return tree.reduce((sum, page) => sum + 1 + countPages(page.children), 0)
}

export async function getPageTree(): Promise<PageWithChildren[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .eq('is_archived', false)
    .order('position', { ascending: true })

  if (error) throw error
  return buildPageTree(data || [])
}

export async function getPage(id: string): Promise<Page | null> {
  const { data, error } = await supabase.from('pages').select('*').eq('id', id).single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

export async function createPage(params: { parentPageId: string | null; title: string }): Promise<Page> {
  const { parentPageId, title } = params

  const { data: siblings, error: siblingsError } = await supabase
    .from('pages')
    .select('position')
    .eq('parent_page_id', parentPageId)
    .order('position', { ascending: false })
    .limit(1)

  if (siblingsError) throw siblingsError

  const nextPosition = (siblings?.[0]?.position ?? -1) + 1

  const { data, error } = await supabase
    .from('pages')
    .insert({
      parent_page_id: parentPageId,
      title,
      position: nextPosition,
      content: { type: 'doc', content: [] },
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePageContent(id: string, content: PageUpdate['content']): Promise<Page> {
  const { data, error } = await supabase
    .from('pages')
    .update({ content })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function renamePage(id: string, title: string): Promise<Page> {
  const { data, error } = await supabase
    .from('pages')
    .update({ title })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePageIcon(id: string, icon: string): Promise<Page> {
  const { data, error } = await supabase.from('pages').update({ icon }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function updatePageCover(id: string, coverImage: string | null): Promise<Page> {
  const { data, error } = await supabase
    .from('pages')
    .update({ cover_image: coverImage })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function reorderPage(
  id: string,
  newPosition: number,
  newParentId: string | null
): Promise<Page> {
  const { data: page, error: pageError } = await supabase
    .from('pages')
    .select('parent_page_id, position')
    .eq('id', id)
    .single()

  if (pageError) throw pageError

  const oldParentId = page.parent_page_id
  const oldPosition = page.position

  if (oldParentId === newParentId && oldPosition === newPosition) {
    return page as Page
  }

  if (oldParentId === newParentId) {
    if (oldPosition < newPosition) {
      const { error } = await supabase
        .from('pages')
        .update({ position: supabase.rpc('decrement_position') })
        .eq('parent_page_id', oldParentId)
        .gt('position', oldPosition)
        .lte('position', newPosition)
      if (error) throw error
    } else {
      const { error } = await supabase
        .from('pages')
        .update({ position: supabase.rpc('increment_position') })
        .eq('parent_page_id', oldParentId)
        .gte('position', newPosition)
        .lt('position', oldPosition)
      if (error) throw error
    }
  } else {
    const { error: decrementError } = await supabase
      .from('pages')
      .update({ position: supabase.rpc('decrement_position') })
      .eq('parent_page_id', oldParentId)
      .gt('position', oldPosition)
    if (decrementError) throw decrementError

    const { data: siblings, error: siblingsError } = await supabase
      .from('pages')
      .select('id, position')
      .eq('parent_page_id', newParentId)
      .gte('position', newPosition)
      .order('position', { ascending: true })

    if (siblingsError) throw siblingsError

    for (const sibling of siblings || []) {
      const { error } = await supabase
        .from('pages')
        .update({ position: sibling.position + 1 })
        .eq('id', sibling.id)
      if (error) throw error
    }
  }

  const { data, error } = await supabase
    .from('pages')
    .update({ parent_page_id: newParentId, position: newPosition })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function archivePage(id: string): Promise<Page> {
  const { data, error } = await supabase
    .from('pages')
    .update({ is_archived: true })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePage(id: string): Promise<void> {
  const { error } = await supabase.from('pages').delete().eq('id', id)
  if (error) throw error
}