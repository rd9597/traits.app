'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function hideMirror(mirrorId: string) {
  const { error } = await supabase
    .from('mirrors')
    .update({
      is_removed: true,
    })
    .eq('id', mirrorId)

  if (error) {
    console.error('Hide mirror failed:', error.message)
    return
  }

  revalidatePath('/admin/moderation')
}

export async function restoreMirror(mirrorId: string) {
  const { error } = await supabase
    .from('mirrors')
    .update({
      is_removed: false,
    })
    .eq('id', mirrorId)

  if (error) {
    console.error('Restore mirror failed:', error.message)
    return
  }

  revalidatePath('/admin/moderation')
}