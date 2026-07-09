import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ItemViewClient } from '@/components/ItemViewClient'
import { Item } from '@/lib/types'

export default async function ViewItemPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch Profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  
  if (!profile) {
    return <div>Error loading profile.</div>
  }

  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!item) {
    notFound()
  }

  // Fetch Time Entries for this specific item, ordered by newest first
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('*')
    .eq('item_id', id)
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-6">
        <a href="/" className="text-sm text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
          &larr; Back to Dashboard
        </a>
      </div>
      <ItemViewClient 
        item={item as Item} 
        timeEntries={timeEntries || []} 
        profile={profile}
      />
    </main>
  )
}
