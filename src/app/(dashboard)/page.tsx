import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DashboardClient } from '@/components/DashboardClient'
import LandingPage from '@/components/LandingPage'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If not logged in, show the public landing page
  if (!user) {
    return <LandingPage />
  }

  // Logged in — show the dashboard
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  
  if (!profile) {
    return <div>Error loading profile.</div>
  }

  const { data: items } = await supabase.from('items').select('*').eq('user_id', user.id).order('sort_order')
  const { data: timeEntries } = await supabase.from('time_entries').select('*').eq('user_id', user.id)

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <DashboardClient 
        profile={profile} 
        items={items || []} 
        timeEntries={timeEntries || []} 
      />
    </main>
  )
}
