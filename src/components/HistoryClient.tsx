'use client'

import { Profile, Item, TimeEntry } from '@/lib/types'
import Link from 'next/link'
import { ActionMenu } from '@/components/ActionMenu'

type Props = {
  profile: Profile
  items: Item[]
  timeEntries: TimeEntry[]
}

export function HistoryClient({ profile, items, timeEntries }: Props) {
  const now = new Date()

  const processedItems = items.map(item => {
    let weeklyAlloc = item.allocated_hours
    if (item.allocated_period === 'day') weeklyAlloc = item.allocated_hours * 7
    if (item.allocated_period === 'month') weeklyAlloc = item.allocated_hours * (7 / 30)

    const isExpired = item.end_date ? new Date(item.end_date) < new Date(now.toDateString()) : false

    let spentView = 0
    let isRunning = false

    let completion: number | null = null
    let lifetimeAllocated: number | null = null
    let lifetimeSpent: number | null = null

    if (item.tracking_mode === 'manual_track') {
      const relevantEntries = timeEntries.filter(te => te.item_id === item.id)

      for (const te of relevantEntries) {
        const start = new Date(te.started_at)
        const autoStopHours = profile.auto_stop_timer_hours || 8
        const end = te.stopped_at ? new Date(te.stopped_at) : new Date(Math.min(now.getTime(), start.getTime() + autoStopHours * 3600000))
        
        if (!te.stopped_at && now.getTime() < start.getTime() + autoStopHours * 3600000) {
          isRunning = true
        }

        spentView += (end.getTime() - start.getTime()) / (1000 * 3600)
      }

      let endDateToUse = now
      if (item.end_date) {
        endDateToUse = new Date(item.end_date)
      } else if (!item.is_active && relevantEntries.length > 0) {
        const lastEntry = relevantEntries.reduce((max, te) => {
          const start = new Date(te.started_at)
          const autoStopHours = profile.auto_stop_timer_hours || 8
          const end = te.stopped_at ? new Date(te.stopped_at) : new Date(Math.min(now.getTime(), start.getTime() + autoStopHours * 3600000))
          return max > end ? max : end
        }, new Date(0))
        endDateToUse = lastEntry
      }

      let activeDays = (endDateToUse.getTime() - new Date(item.created_at).getTime()) / (1000 * 3600 * 24)
      if (activeDays < 1) activeDays = 1

      const allocPerDay = item.allocated_period === 'day' 
        ? item.allocated_hours 
        : item.allocated_period === 'week' 
          ? item.allocated_hours / 7 
          : item.allocated_hours / 30
      
      lifetimeAllocated = activeDays * allocPerDay
      lifetimeSpent = spentView
      completion = lifetimeAllocated > 0 ? (spentView / lifetimeAllocated) * 100 : 0
    } else {
      completion = 100
    }

    const allocView = profile.default_view === 'month' ? weeklyAlloc * (30 / 7) : weeklyAlloc

    return {
      ...item,
      allocView,
      spentView,
      completion,
      isRunning,
      isExpired,
      lifetimeAllocated,
      lifetimeSpent
    }
  })

  const pastItems = processedItems.filter(item => item.isExpired || !item.is_active)

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-visible">
      <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Past Tasks (History)</h2>
      </div>
      
      {pastItems.length === 0 ? (
        <div className="p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-zinc-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">No past tasks</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Tasks with an end date in the past will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto sm:overflow-visible custom-scrollbar pb-32">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-300 dark:border-zinc-600 divide-x divide-gray-300 dark:divide-zinc-600">
                <th className="p-4 font-medium">Where</th>
                <th className="p-4 font-medium">Mode</th>
                <th className="p-4 font-medium text-center">Allocated</th>
                <th className="p-4 font-medium text-center">Completion</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 dark:divide-zinc-600">
              {pastItems.map(item => (
                <tr key={item.id} className="bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors divide-x divide-gray-300 dark:divide-zinc-600">
                  <td className="p-4">
                    <div className="flex items-center">
                      {item.link ? (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                          {item.title}
                        </a>
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-white">{item.title}</span>
                      )}
                      {item.description && (
                        <button 
                          className="ml-2 relative group/tooltip w-4 h-4 rounded-full bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400 flex items-center justify-center text-[10px] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="View description"
                        >
                          i
                          <div className="absolute left-0 top-full mt-2 hidden group-hover/tooltip:block group-focus/tooltip:block w-max max-w-64 min-w-40 z-[60]">
                            <div className="relative bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 text-xs rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 p-3 whitespace-pre-wrap text-left font-normal normal-case leading-relaxed max-h-64 overflow-y-auto custom-scrollbar">
                              {item.description}
                              <div className="absolute -top-1.5 left-2 w-3 h-3 bg-white dark:bg-zinc-800 border-t border-l border-gray-200 dark:border-zinc-700 transform rotate-45"></div>
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                    {item.end_date && item.isExpired && (
                      <div className="text-xs text-red-500 mt-1 font-medium">
                        Expired: {item.end_date.split('T')[0]}
                      </div>
                    )}
                    {!item.is_active && (
                      <div className="text-xs text-orange-500 mt-1 font-medium">
                        Removed
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      item.tracking_mode === 'assumed_spent' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {item.tracking_mode === 'assumed_spent' ? 'Assumed' : 'Manual'}
                    </span>
                  </td>
                  <td className="p-4 text-center whitespace-nowrap text-gray-900 dark:text-white font-medium">
                    {item.allocView === 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Unallocated</span>
                    ) : (
                      <>
                        {item.allocView.toFixed(1)}h
                        <span className="text-xs text-gray-500 dark:text-zinc-400 block font-normal">
                          /{profile.default_view}
                        </span>
                      </>
                    )}
                  </td>
                  <td className="p-4">
                    {item.tracking_mode === 'manual_track' && item.lifetimeAllocated !== null && item.lifetimeSpent !== null ? (
                      <div className="flex justify-center">
                        <button 
                          className="relative group/stats w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="View lifetime stats"
                        >
                          <svg className="w-4 h-4 text-gray-500 dark:text-zinc-400 group-hover/stats:text-blue-600 dark:group-hover/stats:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <div className="absolute right-0 sm:left-1/2 bottom-full mb-2 sm:-translate-x-1/2 hidden group-hover/stats:block group-focus/stats:block w-56 z-50">
                            <div className="relative bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 p-4 text-left font-normal normal-case leading-relaxed">
                              <div className="font-bold text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-zinc-700">Lifetime Completion Rate</div>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-gray-500 dark:text-zinc-400">Total Allocated:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{item.lifetimeAllocated.toFixed(1)}h</span>
                              </div>
                              <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100 dark:border-zinc-700">
                                <span className="text-gray-500 dark:text-zinc-400">Total Recorded:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{item.lifetimeSpent.toFixed(1)}h</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-gray-500 dark:text-zinc-400">Completion:</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{Math.round(item.completion)}%</span>
                              </div>
                              <div className="absolute -bottom-1.5 right-4 sm:left-1/2 sm:-translate-x-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-b border-r border-gray-200 dark:border-zinc-700 transform rotate-45"></div>
                            </div>
                          </div>
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-zinc-400 block text-center">—</span>
                    )}
                  </td>
                  <td className="p-4 flex items-center justify-end space-x-3">
                    <ActionMenu itemId={item.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
