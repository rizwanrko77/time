'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const displayName = formData.get('display_name') as string
  const slug = formData.get('slug') as string
  const pageTitle = formData.get('page_title') as string
  const pageDesc = formData.get('page_desc') as string
  const defaultView = formData.get('default_view') as 'week' | 'month'
  const timezone = formData.get('timezone') as string
  const isPublic = formData.get('is_public') === 'on'
  const autoStopTimerHoursStr = formData.get('auto_stop_timer_hours') as string
  const autoStopTimerHours = autoStopTimerHoursStr ? parseInt(autoStopTimerHoursStr, 10) : 8

  const ctaTitle = formData.get('cta_title') as string
  const ctaDesc = formData.get('cta_description') as string
  const ctaUrl = formData.get('cta_url') as string

  // Note: RLS enforces we can only update our own profile.
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      slug,
      page_title: pageTitle,
      page_desc: pageDesc,
      default_view: defaultView,
      timezone: timezone,
      is_public: isPublic,
      auto_stop_timer_hours: isNaN(autoStopTimerHours) ? 8 : autoStopTimerHours,
    })
    .eq('id', user.id)

  if (profileError) {
    // Unique violation on slug
    if (profileError.code === '23505') {
      return { error: 'Slug is already taken' }
    }
    return { error: profileError.message }
  }

  // Sync display name with Supabase Auth metadata so it shows in the Supabase Dashboard
  await supabase.auth.updateUser({
    data: { name: displayName }
  })

  const { error: ctaError } = await supabase
    .from('cta')
    .update({
      title: ctaTitle || null,
      description: ctaDesc || null,
      url: ctaUrl || null,
    })
    .eq('user_id', user.id)

  if (ctaError) {
    return { error: ctaError.message }
  }

  revalidatePath('/settings')
  return { success: true }
}
