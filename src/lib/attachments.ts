import { supabase } from './supabase'
import type { Attachment, AttachmentInsert } from '@/types/database'

export async function getAttachments(pageId: string): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from('attachments')
    .select('*')
    .eq('page_id', pageId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function uploadAttachment(
  pageId: string,
  file: File
): Promise<Attachment> {
  const fileExt = file.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `${pageId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath)

  const { data, error } = await supabase
    .from('attachments')
    .insert({
      page_id: pageId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteAttachment(id: string): Promise<void> {
  const { data: attachment, error: fetchError } = await supabase
    .from('attachments')
    .select('file_url')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const url = new URL(attachment.file_url)
  const pathParts = url.pathname.split('/')
  const filePath = pathParts.slice(pathParts.indexOf('attachments') + 1).join('/')

  const { error: storageError } = await supabase.storage
    .from('attachments')
    .remove([filePath])

  if (storageError) throw storageError

  const { error } = await supabase.from('attachments').delete().eq('id', id)
  if (error) throw error
}