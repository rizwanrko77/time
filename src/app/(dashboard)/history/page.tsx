import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HistoryClient } from '@/components/HistoryClient'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch Profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  
  if (!profile) {
    return <div>Error loading profile.</div>
  }

  // Fetch Items
  const { data: items } = await supabase.from('items').select('*').eq('user_id', user.id).order('sort_order')

  // Fetch Time Entries
  const { data: timeEntries } = await supabase.from('time_entries').select('*').eq('user_id', user.id)

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <HistoryClient 
        profile={profile} 
        items={items || []} 
        timeEntries={timeEntries || []} 
      />
    </main>
  )
}
