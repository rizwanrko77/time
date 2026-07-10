'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string || null
  const link = formData.get('link') as string || null
  const trackingMode = formData.get('tracking_mode') as 'assumed_spent' | 'manual_track'
  
  const rawHours = parseFloat(formData.get('allocated_hours') as string)
  const period = formData.get('period') as 'day' | 'week' | 'month'
  
  let noticePeriodDays = formData.get('notice_period_days') ? parseInt(formData.get('notice_period_days') as string, 10) : null
  const endDateStr = formData.get('end_date') as string
  const endDate = endDateStr ? new Date(endDateStr).toISOString() : null
  
  if (!title || isNaN(rawHours) || rawHours <= 0 || !period) {
    return { error: 'Invalid input data' }
  }

  if (trackingMode === 'assumed_spent') {
    noticePeriodDays = null
  } else if (noticePeriodDays === null || isNaN(noticePeriodDays) || noticePeriodDays < 0) {
    return { error: 'Valid notice period required for manual track mode' }
  }

  // Prevent double-submission race conditions
  const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString()
  const { data: recentItems } = await supabase
    .from('items')
    .select('id')
    .eq('user_id', user.id)
    .eq('title', title)
    .gte('created_at', fiveSecondsAgo)
    .limit(1)

  if (recentItems && recentItems.length > 0) {
    revalidatePath('/')
    redirect('/')
  }

  // Get max sort_order
  const { data: existingItems } = await supabase
    .from('items')
    .select('sort_order')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: false })
    .limit(1)
  
  const sortOrder = existingItems?.[0]?.sort_order !== undefined ? existingItems[0].sort_order + 1 : 0

  const { error } = await supabase.from('items').insert({
    user_id: user.id,
    title,
    description,
    link,
    allocated_hours: rawHours,
    allocated_period: period,
    tracking_mode: trackingMode,
    notice_period_days: noticePeriodDays,
    end_date: endDate,
    sort_order: sortOrder,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  redirect('/')
}

export async function updateItem(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const title = formData.get('title') as string
  const description = formData.get('description') as string || null
  const link = formData.get('link') as string || null
  const trackingMode = formData.get('tracking_mode') as 'assumed_spent' | 'manual_track'
  
  const rawHours = parseFloat(formData.get('allocated_hours') as string)
  const period = formData.get('period') as 'day' | 'week' | 'month'
  
  let noticePeriodDays = formData.get('notice_period_days') ? parseInt(formData.get('notice_period_days') as string, 10) : null
  const endDateStr = formData.get('end_date') as string
  const endDate = endDateStr ? new Date(endDateStr).toISOString() : null
  
  if (!title || isNaN(rawHours) || rawHours <= 0 || !period) {
    return { error: 'Invalid input data' }
  }

  if (trackingMode === 'assumed_spent') {
    noticePeriodDays = null
  } else if (noticePeriodDays === null || isNaN(noticePeriodDays) || noticePeriodDays < 0) {
    return { error: 'Valid notice period required for manual track mode' }
  }

  // Prevent ghost timers: If switching to assumed_spent or expiring the item, auto-stop any running timer
  const isExpired = endDate ? new Date(endDate) < new Date(new Date().toDateString()) : false
  if (trackingMode === 'assumed_spent' || isExpired) {
    await supabase
      .from('time_entries')
      .update({ stopped_at: new Date().toISOString() })
      .eq('item_id', id)
      .eq('user_id', user.id)
      .is('stopped_at', null)
  }


  const { error } = await supabase
    .from('items')
    .update({
      title,
      description,
      link,
      allocated_hours: rawHours,
      allocated_period: period,
      tracking_mode: trackingMode,
      notice_period_days: noticePeriodDays,
      end_date: endDate,
      is_active: true,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/items/${id}`)
  redirect('/')
}

export async function deleteItem(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('items')
    .update({ is_active: false })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  redirect('/')
}
