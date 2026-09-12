'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function startTimer(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Clean stale timers first
  await supabase.rpc('clean_stale_timers', { p_user_id: user.id })

  // Verify item belongs to user and is manual track
  const { data: item } = await supabase
    .from('items')
    .select('id, tracking_mode')
    .eq('id', itemId)
    .eq('user_id', user.id)
    .single()
    
  if (!item || item.tracking_mode !== 'manual_track') {
    return { error: 'Invalid item' }
  }

  // Check if any other timer is running for this user
  const { data: runningEntry } = await supabase
    .from('time_entries')
    .select('id, items(title)')
    .eq('user_id', user.id)
    .is('stopped_at', null)
    .single()

  if (runningEntry) {
    const itemsData = runningEntry.items as any;
    const title = (Array.isArray(itemsData) ? itemsData[0]?.title : itemsData?.title) || 'Another item';
    return { error: `"${title}" is already active. Please stop it to start tracking time for this item.` }
  }

  const { error } = await supabase
    .from('time_entries')
    .insert({
      item_id: itemId,
      user_id: user.id,
      started_at: new Date().toISOString(),
    })

  if (error) {
    if (error.code === '23505') { // unique violation for one_running_per_item
      return { error: 'Timer already running' }
    }
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function stopTimer(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Clean stale timers first
  await supabase.rpc('clean_stale_timers', { p_user_id: user.id })

  // Find the open entry
  const { data: openEntry } = await supabase
    .from('time_entries')
    .select('id')
    .eq('item_id', itemId)
    .eq('user_id', user.id)
    .is('stopped_at', null)
    .single()

  if (!openEntry) {
    return { error: 'No running timer found' }
  }

  const { error } = await supabase
    .from('time_entries')
    .update({ stopped_at: new Date().toISOString() })
    .eq('id', openEntry.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { success: true }
}

export async function updateTimeEntryNotes(entryId: string, notes: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('time_entries')
    .update({ notes })
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/items/[id]`, 'page')
  return { success: true }
}

export async function cleanStaleTimers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await supabase.rpc('clean_stale_timers', { p_user_id: user.id })
    revalidatePath('/')
  }
}

export async function updateTimeEntry(entryId: string, startedAt: string, stoppedAt: string | null, notes: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('time_entries')
    .update({ 
      started_at: startedAt, 
      stopped_at: stoppedAt, 
      notes: notes 
    })
    .eq('id', entryId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/items/[id]`, 'page')
  return { success: true }
}

