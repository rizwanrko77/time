'use client'

import { useState, useEffect, useTransition } from 'react'
import { Item, TimeEntry, Profile } from '@/lib/types'
import { startTimer, stopTimer, updateTimeEntryNotes } from '@/app/actions/timer'
import Link from 'next/link'
import { SessionNoteEditor } from './SessionNoteEditor'

type Props = {
  item: Item
  timeEntries: TimeEntry[]
  profile: Profile
}

export function ItemViewClient({ item, timeEntries, profile }: Props) {
  const [now, setNow] = useState(new Date())
  const [isPending, startTransition] = useTransition()
  const [mounted, setMounted] = useState(false)
  
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [presetFilter, setPresetFilter] = useState<string>('All Time')
  const [filterStartDate, setFilterStartDate] = useState<string>('')
  const [filterEndDate, setFilterEndDate] = useState<string>('')
  
  // Sort entries so latest is at the top
  const sortedEntries = [...timeEntries].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())

  // Date bounds helper
  const getBoundsForPreset = (preset: string) => {
    if (preset === 'All Time' || preset === 'Custom Date') return null;
    
    const today = new Date();
    const toYMD = (d: Date) => {
      return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    }
    
    const d = new Date();
    
    if (preset === 'Today') return { start: toYMD(today), end: toYMD(today) };
    if (preset === 'Yesterday') {
      d.setDate(d.getDate() - 1);
      return { start: toYMD(d), end: toYMD(d) };
    }
    if (preset === 'This Week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as start
      d.setDate(diff);
      const start = toYMD(d);
      d.setDate(d.getDate() + 6);
      return { start, end: toYMD(d) };
    }
    if (preset === 'Last Week') {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7;
      d.setDate(diff);
      const start = toYMD(d);
      d.setDate(d.getDate() + 6);
      return { start, end: toYMD(d) };
    }
    if (preset === 'This Month') {
      const start = toYMD(new Date(d.getFullYear(), d.getMonth(), 1));
      const end = toYMD(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      return { start, end };
    }
    if (preset === 'Last Month') {
      const start = toYMD(new Date(d.getFullYear(), d.getMonth() - 1, 1));
      const end = toYMD(new Date(d.getFullYear(), d.getMonth(), 0));
      return { start, end };
    }
    if (preset === 'This Quarter') {
      const quarter = Math.floor(d.getMonth() / 3);
      const start = toYMD(new Date(d.getFullYear(), quarter * 3, 1));
      const end = toYMD(new Date(d.getFullYear(), quarter * 3 + 3, 0));
      return { start, end };
    }
    if (preset === 'Last Quarter') {
      const quarter = Math.floor(d.getMonth() / 3) - 1;
      const start = toYMD(new Date(d.getFullYear(), quarter * 3, 1));
      const end = toYMD(new Date(d.getFullYear(), quarter * 3 + 3, 0));
      return { start, end };
    }
    return null;
  }

  const bounds = getBoundsForPreset(presetFilter);
  const effectiveStart = bounds ? bounds.start : filterStartDate;
  const effectiveEnd = bounds ? bounds.end : filterEndDate;

  // Apply filters
  const filteredEntries = sortedEntries.filter(te => {
    if (presetFilter === 'All Time') return true;
    if (presetFilter === 'Custom Date' && !effectiveStart && !effectiveEnd) return true;
    
    const startObj = new Date(te.started_at);
    const localDateStr = new Date(startObj.getTime() - (startObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    if (effectiveStart && localDateStr < effectiveStart) return false;
    if (effectiveEnd && localDateStr > effectiveEnd) return false;
    return true;
  })

  let filteredDurationMs = 0
  for (const te of filteredEntries) {
    const start = new Date(te.started_at)
    const end = te.stopped_at ? new Date(te.stopped_at) : now
    filteredDurationMs += (end.getTime() - start.getTime())
  }

  // Update 'now' every minute to refresh live timers
  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Calculate if expired or archived
  const isExpired = item.end_date ? new Date(item.end_date) < new Date(now.toDateString()) : false
  const isArchived = item.is_active === false || isExpired

  // Determine if it's currently running based on timeEntries
  const latestEntry = timeEntries.length > 0 ? timeEntries[0] : null // Assuming they are sorted descending
  const isRunning = latestEntry && latestEntry.stopped_at === null

  const handleTimer = (isRunningState: boolean | null) => {
    startTransition(async () => {
      if (isRunningState) {
        const res = await stopTimer(item.id)
        if (res?.error) alert(res.error)
      } else {
        const res = await startTimer(item.id)
        if (res?.error) alert(res.error)
      }
    })
  }

  const formatDuration = (ms: number) => {
    if (ms < 0) return '0h 0m'
    const totalMins = Math.floor(ms / 60000)
    const hours = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m`
  }

  const formatDate = (dateStr: string) => {
    if (!mounted) return '' // Prevent hydration mismatch
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    })
  }

  let totalSpentMs = 0
  for (const te of timeEntries) {
    const start = new Date(te.started_at)
    if (te.stopped_at) {
      const end = new Date(te.stopped_at)
      totalSpentMs += (end.getTime() - start.getTime())
    } else {
      totalSpentMs += (now.getTime() - start.getTime())
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
        <div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{item.title}</h1>
              {item.is_active === false ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                  Removed
                </span>
              ) : isExpired ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                  Expired
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  Active
                </span>
              )}
            </div>
            {item.description && (
              <p className="mt-2 text-gray-600 dark:text-zinc-400 whitespace-pre-wrap">{item.description}</p>
            )}
            {item.link && (
              <a href={item.link} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline">
                View related link &rarr;
              </a>
            )}
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            {isRunning ? (
              <button
                disabled
                title="Stop timer to edit details"
                className="flex-1 flex justify-center items-center px-4 py-3 bg-gray-100 dark:bg-zinc-800 text-sm font-medium text-gray-400 dark:text-zinc-500 rounded-lg cursor-not-allowed opacity-50"
              >
                Edit Details (Stop timer first)
              </button>
            ) : (
              <Link
                href={`/items/${item.id}/edit`}
                className="flex-1 flex justify-center items-center px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-sm font-medium text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Edit Details
              </Link>
            )}
            
            {item.tracking_mode === 'manual_track' && (
              <button
                onClick={() => handleTimer(isRunning)}
                disabled={isPending}
                className={`flex-1 flex justify-center items-center px-6 py-3 rounded-lg text-sm font-bold shadow-sm transition-colors ${
                  isRunning 
                    ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2' 
                    : 'bg-green-500 text-white hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                } disabled:opacity-50`}
              >
                {isPending ? 'Working...' : isRunning ? 'Stop Timer' : 'Start Timer'}
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 dark:border-zinc-800 pt-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Allocated</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {item.allocated_hours}h / {item.allocated_period}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Total Logged Time</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {mounted ? formatDuration(totalSpentMs) : '--h --m'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-zinc-400">Tracking Mode</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {item.tracking_mode === 'manual_track' ? 'Manual Timer' : 'Assumed Spent'}
            </p>
          </div>
        </div>
      </div>

      {item.tracking_mode === 'manual_track' && (
        <div>
          <div className="p-4 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white shrink-0">Session History</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <select 
                  value={presetFilter}
                  onChange={(e) => {
                    setPresetFilter(e.target.value)
                    if (e.target.value !== 'Custom Date') {
                      setFilterStartDate('')
                      setFilterEndDate('')
                    }
                  }}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-sm"
                >
                  {['All Time', 'Today', 'Yesterday', 'This Week', 'Last Week', 'This Month', 'Last Month', 'This Quarter', 'Last Quarter', 'Custom Date'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                
                {presetFilter === 'Custom Date' && (
                  <div className="flex items-center gap-2">
                    <input 
                      type="date" 
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                    <span className="text-gray-500 dark:text-zinc-500">-</span>
                    <input 
                      type="date" 
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="text-sm px-2 py-1.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                  </div>
                )}
              </div>
              
              {presetFilter !== 'All Time' && (
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/40 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800/50 whitespace-nowrap shadow-sm">
                    Total: {mounted ? formatDuration(filteredDurationMs) : '--m'}
                  </div>
                  <button 
                    onClick={() => { setPresetFilter('All Time'); setFilterStartDate(''); setFilterEndDate(''); }}
                    className="sm:hidden text-sm text-red-500 font-medium px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded-md"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {filteredEntries.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-zinc-400">
              No time tracked yet. Click "Start Timer" to begin your first session.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800">
                    <th className="p-4 font-medium">Started At</th>
                    <th className="p-4 font-medium">Stopped At</th>
                    <th className="p-4 font-medium text-right">Duration</th>
                    <th className="p-4 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
                  {filteredEntries.map(te => {
                    const start = new Date(te.started_at)
                    const end = te.stopped_at ? new Date(te.stopped_at) : now
                    const durationMs = end.getTime() - start.getTime()
                    
                    return (
                      <tr key={te.id} className="hover:bg-gray-50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="p-4 text-sm text-gray-900 dark:text-white">
                          {formatDate(te.started_at)}
                        </td>
                        <td className="p-4 text-sm text-gray-900 dark:text-white">
                          {te.stopped_at ? formatDate(te.stopped_at) : <span className="text-green-500 font-medium">Running...</span>}
                        </td>
                        <td className="p-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                          {mounted ? formatDuration(durationMs) : '--m'}
                        </td>
                        <td className="p-4 text-sm text-gray-500 dark:text-zinc-400">
                          <button 
                            onClick={() => setEditingEntryId(te.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors group"
                            title={te.notes ? "Edit Note" : "Add Note"}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Note Editor Panel */}
      <SessionNoteEditor 
        isOpen={editingEntryId !== null}
        entryId={editingEntryId}
        onClose={() => setEditingEntryId(null)}
        initialNotes={timeEntries.find(te => te.id === editingEntryId)?.notes || ''}
        onSave={async (notes) => {
          if (editingEntryId) {
            await updateTimeEntryNotes(editingEntryId, notes)
          }
        }}
      />
    </div>
  )
}
