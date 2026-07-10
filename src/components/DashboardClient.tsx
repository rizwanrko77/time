'use client'

import { useState, useEffect, useTransition } from 'react'
import { Item, Profile, TimeEntry } from '@/lib/types'
import { capacity } from '@/lib/hours'
import Link from 'next/link'
import { startTimer, stopTimer } from '@/app/actions/timer'
import { ActionMenu } from '@/components/ActionMenu'

type DashboardProps = {
  profile: Profile
  items: Item[]
  timeEntries: TimeEntry[]
}

export function DashboardClient({ profile, items, timeEntries }: DashboardProps) {
  const [view, setView] = useState<'week'|'month'>(profile.default_view || 'week')
  const [now, setNow] = useState(new Date())
  const [isMounted, setIsMounted] = useState(false)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Update 'now' every minute to refresh live timers
  useEffect(() => {
    setIsMounted(true)
    const interval = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  // Disable pull-to-refresh on mobile when in fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overscrollBehaviorY = 'none'
      document.documentElement.style.overscrollBehaviorY = 'none'
    } else {
      document.body.style.overscrollBehaviorY = 'auto'
      document.documentElement.style.overscrollBehaviorY = 'auto'
    }
    
    return () => {
      document.body.style.overscrollBehaviorY = 'auto'
      document.documentElement.style.overscrollBehaviorY = 'auto'
    }
  }, [isFullscreen])

  if (!isMounted) return null

  const cap = capacity(view)
  const factor = view === 'month' ? 30/7 : 1

  let allocTotal = 0
  let potentialAvail = 0

  const processedItems = items.map(item => {
    let weeklyAlloc = item.allocated_hours
    if (item.allocated_period === 'day') weeklyAlloc = item.allocated_hours * 7
    if (item.allocated_period === 'month') weeklyAlloc = item.allocated_hours * (7 / 30)

    const allocView = view === 'month' ? weeklyAlloc * (30 / 7) : weeklyAlloc
    
    // Check if item is expired
    const isExpired = item.end_date ? new Date(item.end_date) < new Date(now.toDateString()) : false
    const isActive = item.is_active !== false // Treat null/undefined as true, or explicitly true

    if (!isExpired && isActive) {
      allocTotal += allocView
      if (item.notice_period_days === 0) {
        potentialAvail += allocView
      }
    }

    let spentView = 0
    let isRunning = false

    if (item.tracking_mode === 'manual_track') {
      const windowMs = view === 'month' ? 30 * 24 * 3600 * 1000 : 7 * 24 * 3600 * 1000
      const cutoff = new Date(now.getTime() - windowMs)

      const relevantEntries = timeEntries.filter(te => te.item_id === item.id)

      for (const te of relevantEntries) {
        const start = new Date(te.started_at)
        if (start < cutoff) continue // Ignore old entries for completion rate

        if (te.stopped_at) {
          const stop = new Date(te.stopped_at)
          spentView += (stop.getTime() - start.getTime()) / 3600000
        } else {
          isRunning = true
          spentView += (now.getTime() - start.getTime()) / 3600000
        }
      }
    }

    const completion = item.tracking_mode === 'manual_track' && allocView > 0
      ? Math.round((spentView / allocView) * 100)
      : null

    let stats_7d: number | null = null
    let stats_30d: number | null = null
    let stats_90d: number | null = null

    if (item.tracking_mode === 'manual_track' && item.allocated_hours > 0) {
      let spent7 = 0
      let spent30 = 0
      let spent90 = 0
      const cutoff7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000)
      const cutoff30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000)
      const cutoff90 = new Date(now.getTime() - 90 * 24 * 3600 * 1000)
      const relevantEntries = timeEntries.filter(te => te.item_id === item.id)

      for (const te of relevantEntries) {
        const start = new Date(te.started_at)
        const stop = te.stopped_at ? new Date(te.stopped_at) : now
        const hours = (stop.getTime() - start.getTime()) / 3600000

        if (start >= cutoff90) spent90 += hours
        if (start >= cutoff30) spent30 += hours
        if (start >= cutoff7) spent7 += hours
      }

      const alloc7 = item.allocated_period === 'day' ? item.allocated_hours * 7 : item.allocated_period === 'week' ? item.allocated_hours : item.allocated_hours * (7/30)
      const alloc30 = item.allocated_period === 'day' ? item.allocated_hours * 30 : item.allocated_period === 'week' ? item.allocated_hours * (30/7) : item.allocated_hours
      const alloc90 = item.allocated_period === 'day' ? item.allocated_hours * 90 : item.allocated_period === 'week' ? item.allocated_hours * (90/7) : item.allocated_hours * 3

      stats_7d = Math.round((spent7 / alloc7) * 100)
      stats_30d = Math.round((spent30 / alloc30) * 100)
      stats_90d = Math.round((spent90 / alloc90) * 100)
    }

    return { ...item, allocView, spentView, completion, isRunning, isExpired, stats_7d, stats_30d, stats_90d }
  })

  const activeItems = processedItems.filter(item => !item.isExpired && item.is_active)

  // Past items are now handled on the /history page

  const comfortable = cap - allocTotal
  const potential = comfortable + potentialAvail

  const handleTimer = (itemId: string, isRunning: boolean) => {
    setPendingItemId(itemId)
    startTransition(async () => {
      if (isRunning) {
        const res = await stopTimer(itemId)
        if (res?.error) alert(res.error)
      } else {
        const res = await startTimer(itemId)
        if (res?.error) alert(res.error)
      }
    })
  }

  const viewLabel = view === 'week' ? 'Weekly' : 'Monthly'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{viewLabel} Capacity Summary</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-zinc-400">Total Capacity ({viewLabel})</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{cap}h</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-zinc-400">Allocated ({view === 'week' ? 'Weekly' : 'Monthly'})</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{allocTotal.toFixed(1)}h</p>
        </div>
        <div className={`bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm ${comfortable < 0 ? 'ring-2 ring-red-500' : ''}`}>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Comfortably Available ({view === 'week' ? 'Weekly' : 'Monthly'})</p>
          <p className={`text-2xl font-bold ${comfortable < 0 ? 'text-red-600' : 'text-green-600'}`}>
            {Math.max(comfortable, 0).toFixed(1)}h
          </p>
          {comfortable < 0 && <p className="text-xs text-red-500 mt-1">Over-allocated by {Math.abs(comfortable).toFixed(1)}h</p>}
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-zinc-400">Potentially Available ({view === 'week' ? 'Weekly' : 'Monthly'})</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.max(potential, 0).toFixed(1)}h</p>
        </div>
      </div>

      <div className={`bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-visible flex flex-col ${isFullscreen ? 'fixed inset-0 z-[100] m-0 sm:m-4 sm:rounded-xl overflow-y-auto overscroll-none max-h-screen sm:max-h-[calc(100vh-32px)]' : ''}`}>
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 bg-white dark:bg-zinc-900 z-10 sm:rounded-t-xl">
          <div className="flex justify-between items-center w-full sm:w-auto">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Items</h2>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="sm:hidden p-1.5 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 w-full sm:w-auto">
              <button
                onClick={() => setView('week')}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'week' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}
              >
                Week
              </button>
              <button
                onClick={() => setView('month')}
                className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${view === 'month' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow' : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'}`}
              >
                Month
              </button>
            </div>
            <Link href="/items/new" className="text-sm text-center font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors shrink-0">
              Add item
            </Link>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden sm:block p-1.5 text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-300 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {processedItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-zinc-400">
            No items yet. Create one to start tracking.
          </div>
        ) : (
          <div className="overflow-x-auto sm:overflow-visible custom-scrollbar pb-32">
            <table className="w-full min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-zinc-800/50 text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-300 dark:border-zinc-600 divide-x divide-gray-300 dark:divide-zinc-600">
                  <th className="p-4 font-medium">Where</th>
                  <th className="p-4 font-medium">Mode</th>
                  <th className="p-4 font-medium text-center">Allocated</th>
                  <th className="p-4 font-medium">Completion</th>
                  <th className="p-4 font-medium text-center">Notice</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 dark:divide-zinc-600">
                {activeItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-zinc-400">
                      No active items for this view.
                    </td>
                  </tr>
                ) : (
                  activeItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors divide-x divide-gray-300 dark:divide-zinc-600">
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
                      </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${item.tracking_mode === 'manual_track' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {item.tracking_mode === 'manual_track' ? 'Timer' : 'Assumed'}
                      </span>
                    </td>
                    <td className="p-4 text-center whitespace-nowrap text-gray-900 dark:text-white font-medium">
                      {item.allocView.toFixed(1)}h <span className="text-xs text-gray-500 dark:text-zinc-400 font-normal">/ {view}</span>
                    </td>
                    <td className="p-4">
                      {item.completion !== null ? (
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-sm text-gray-900 dark:text-white">{item.completion}%</span>
                          
                          {item.stats_7d !== null && (
                            <div className="flex justify-center">
                              <button 
                                className="relative group/stats w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label="View stats"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400 group-hover/stats:text-blue-600 dark:group-hover/stats:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <div className="absolute right-0 sm:left-1/2 bottom-full mb-2 sm:-translate-x-1/2 hidden group-hover/stats:block group-focus/stats:block w-48 z-50">
                                  <div className="relative bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 text-xs rounded-xl shadow-xl border border-gray-200 dark:border-zinc-700 p-4 text-left font-normal normal-case leading-relaxed">
                                    <div className="flex flex-col space-y-3">
                                      <div>
                                        <span className="text-gray-500 dark:text-zinc-400 block mb-0.5">Current Cycle (7d)</span>
                                        <span className="font-bold text-gray-900 dark:text-white text-lg">{item.stats_7d}%</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 dark:text-zinc-400 block mb-0.5">30-Day Average</span>
                                        <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{item.stats_30d}%</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 dark:text-zinc-400 block mb-0.5">90-Day Average</span>
                                        <span className="font-bold text-purple-600 dark:text-purple-400 text-lg">{item.stats_90d}%</span>
                                      </div>
                                    </div>
                                    <div className="absolute -bottom-1.5 right-2 sm:left-1/2 sm:-translate-x-1/2 w-3 h-3 bg-white dark:bg-zinc-800 border-b border-r border-gray-200 dark:border-zinc-700 transform rotate-45"></div>
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-4 text-center text-sm text-gray-600 dark:text-zinc-400">
                      <div>{item.notice_period_days === null ? 'N/A' : item.notice_period_days === 0 ? 'At will' : `${item.notice_period_days} days`}</div>
                      {item.end_date && <div className="text-xs text-gray-400 mt-1 font-medium bg-gray-100 dark:bg-zinc-800 inline-block px-1.5 py-0.5 rounded">Ends: {item.end_date.split('T')[0]}</div>}
                    </td>
                    <td className="p-4 flex items-center justify-end space-x-3">
                      {item.tracking_mode === 'manual_track' && (
                        <button
                          onClick={() => handleTimer(item.id, item.isRunning)}
                          disabled={isPending && pendingItemId === item.id}
                          className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            item.isRunning 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {(isPending && pendingItemId === item.id) ? (item.isRunning ? 'Stopping...' : 'Starting...') : (item.isRunning ? 'Stop' : 'Start')}
                        </button>
                      )}
                      <ActionMenu itemId={item.id} isRunning={item.isRunning} />
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
