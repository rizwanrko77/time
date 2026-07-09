import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PublicSummary } from '@/lib/types'
import { headers } from 'next/headers'
import type { Metadata } from 'next'

export const revalidate = 60 // Cache for 60 seconds

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data: profile } = await supabase.from('profiles').select('display_name, page_title, page_desc').eq('slug', slug).single()

  if (!profile) {
    return { title: 'Not Found' }
  }

  return {
    title: `${profile.display_name}'s Availability`,
    description: profile.page_desc || `See ${profile.display_name}'s current time allocation and availability.`,
    openGraph: {
      title: profile.page_title || `${profile.display_name}'s Availability`,
      description: profile.page_desc || `See ${profile.display_name}'s current time allocation and availability.`,
      url: `https://time.iamrizwan.com/${slug}`,
      type: 'profile',
    },
  }
}

export default async function PublicPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<{ view?: string }> }) {
  const { slug } = await params
  const { view: queryView } = await searchParams

  const supabase = createAdminClient()

  // If view is not provided, we pass 'week' as default, but the PG function defaults to the user's default_view
  // wait, the PG function `get_public_summary` takes p_view. We'll pass the query view or 'default'.
  // Actually, let's fetch the profile first to get default_view, or just let PG function handle it.
  // The function logic: if p_view = 'month' then ... else ...
  // It doesn't dynamically check profile.default_view for p_view.
  // Let's get the profile default view.

  const { data: profile } = await supabase.from('profiles').select('default_view').eq('slug', slug).single()
  
  if (!profile) {
    notFound()
  }

  const activeView = queryView === 'week' || queryView === 'month' ? queryView : profile.default_view

  const { data, error } = await supabase.rpc('get_public_summary', {
    p_slug: slug,
    p_view: activeView,
  })

  if (error || !data) {
    notFound()
  }

  const summary = data as PublicSummary

  const headersList = await headers()
  // Add frame-ancestors headers using Next.js config or inline if possible (actually CSP is best set in next.config.ts or middleware, but the proxy.ts handles it)
  // We can just rely on Next.js default which doesn't block iframes unless set.

  return (
    <div className="min-h-screen bg-transparent p-2 sm:p-4 font-sans text-gray-900 dark:text-white">
      <div className="max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{summary.page_title}</h1>
          </div>
          {summary.page_desc && (
            <p className="mt-4 text-gray-500 dark:text-zinc-400 text-sm whitespace-pre-wrap leading-relaxed">{summary.page_desc}</p>
          )}
        </div>

        <div className="p-3 sm:p-6">
          <div className="flex justify-end mb-4">
            <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 shrink-0 w-full sm:w-auto">
              <Link
                href={`/${slug}?view=week`}
                scroll={false}
                className={`flex-1 sm:flex-none text-center px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeView === 'week' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}
              >
                Week
              </Link>
              <Link
                href={`/${slug}?view=month`}
                scroll={false}
                className={`flex-1 sm:flex-none text-center px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeView === 'month' ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}
              >
                Month
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto sm:overflow-visible custom-scrollbar w-full pb-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm mb-8">
            <table className="w-full min-w-[600px] text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-300 dark:border-zinc-600 text-left divide-x divide-gray-300 dark:divide-zinc-600">
                  <th className="pb-3 font-medium w-[140px] sm:w-auto px-4 sm:px-6 pt-4">Where</th>
                  <th className="pb-3 font-medium text-center pt-4">Allocated</th>
                  <th className="pb-3 font-medium text-center pt-4">Notice</th>
                  <th className="pb-3 font-medium text-center pt-4">Stats</th>
                </tr>
              </thead>
            <tbody className="divide-y divide-gray-300 dark:divide-zinc-600">
              {summary.items.map((item, idx) => (
                <tr key={idx} className="divide-x divide-gray-300 dark:divide-zinc-600">
                  <td className="py-4 w-[140px] sm:w-auto px-4 sm:px-6">
                    <div className="flex items-center">
                      <div className="line-clamp-2 max-w-[110px] sm:max-w-[300px]">
                        {item.link ? (
                          <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                            {item.title}
                          </a>
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-white">{item.title}</span>
                        )}
                      </div>
                      {item.description && (
                        <button 
                          className="ml-2 relative group/tooltip w-4 h-4 rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 flex items-center justify-center text-[10px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="View description"
                        >
                          i
                          <div className="absolute left-0 sm:-left-4 top-full mt-2 hidden group-hover/tooltip:block group-focus/tooltip:block w-max max-w-64 min-w-40 z-[70]">
                            <div className="relative bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-xs rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 p-3 whitespace-pre-wrap text-left font-normal normal-case leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
                              {item.description}
                              <div className="absolute -top-1.5 left-2 w-3 h-3 bg-white dark:bg-zinc-800 border-t border-l border-gray-200 dark:border-zinc-700 transform rotate-45"></div>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-center whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {item.allocated.toFixed(1)}h
                  </td>
                  <td className="py-4 text-center text-sm text-gray-600 dark:text-zinc-400">
                    <div>{item.notice_days === null ? 'N/A' : item.notice_days === 0 ? 'At will' : `${item.notice_days} days`}</div>
                    {item.end_date && <div className="text-xs text-gray-400 mt-1 font-medium bg-gray-100 dark:bg-zinc-800 inline-block px-1.5 py-0.5 rounded">Ends: {item.end_date.split('T')[0]}</div>}
                  </td>
                  <td className="py-4">
                    {item.stats_7d !== null ? (
                      <div className="flex justify-center">
                        <button 
                          className="relative group/stats w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="View stats"
                        >
                          <svg className="w-4 h-4 text-gray-500 dark:text-zinc-400 group-hover/stats:text-blue-600 dark:group-hover/stats:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover/stats:block group-focus/stats:block w-48 z-50">
                            <div className="relative bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 p-4 text-left font-normal normal-case leading-relaxed">
                              <div className="flex flex-col space-y-3">
                                <div>
                                  <span className="text-gray-500 dark:text-zinc-400 block mb-0.5">Current Cycle (7d)</span>
                                  <span className="font-bold text-gray-900 dark:text-white text-lg">{item.stats_7d}%</span>
                                </div>
                                {item.stats_30d !== null && (
                                  <div>
                                    <span className="text-gray-500 dark:text-zinc-400 block mb-0.5">30-Day Average</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{item.stats_30d}%</span>
                                  </div>
                                )}
                                {item.stats_90d !== null && (
                                  <div>
                                    <span className="text-gray-500 dark:text-zinc-400 block mb-0.5">90-Day Average</span>
                                    <span className="font-bold text-purple-600 dark:text-purple-400 text-lg">{item.stats_90d}%</span>
                                  </div>
                                )}
                              </div>
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-b border-r border-gray-200 dark:border-zinc-700 transform rotate-45"></div>
                            </div>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-center block">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {summary.items.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-zinc-400">
                    No active items.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 group relative">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-gray-500 font-medium">Comfortably Available</p>
                <div className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] cursor-help" title="Time not committed to anything. Free to take on right now.">i</div>
              </div>
              <p className="text-2xl font-bold text-green-600">{summary.comfortable.toFixed(1)}h</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 group relative">
              <div className="flex justify-between items-center mb-1">
                <p className="text-sm text-gray-500 font-medium">Potentially Available</p>
                <div className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] cursor-help" title="Comfortably available time, plus tasks I can drop at will (0 notice). Tasks with a notice period could free up later, after their notice.">i</div>
              </div>
              <p className="text-2xl font-bold text-blue-600">{summary.potential.toFixed(1)}h</p>
            </div>
          </div>

          {summary.cta && (summary.cta.title || summary.cta.description || summary.cta.url) && (
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
              {summary.cta.title && <h3 className="text-lg font-bold text-blue-900 mb-2">{summary.cta.title}</h3>}
              {summary.cta.description && <p className="text-blue-800 text-sm mb-4">{summary.cta.description}</p>}
              {summary.cta.url && (
                <a
                  href={summary.cta.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  Get in touch
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
