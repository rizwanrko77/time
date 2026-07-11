'use client'

import { useActionState, useState, useTransition } from 'react'
import { createItem, updateItem, deleteItem } from '@/app/actions/items'
import Link from 'next/link'

type ItemFormProps = {
  item?: {
    id: string
    title: string
    description: string | null
    link: string | null
    allocated_hours: number
    allocated_period: 'day' | 'week' | 'month'
    tracking_mode: 'assumed_spent' | 'manual_track'
    notice_period_days: number | null
    end_date: string | null
    is_active?: boolean
  }
}

export function ItemForm({ item }: ItemFormProps) {
  const isEdit = !!item
  const isExpired = item?.end_date ? new Date(item.end_date) < new Date(new Date().toDateString()) : false
  const isArchived = isEdit && (item.is_active === false || isExpired)

  const [trackingMode, setTrackingMode] = useState<'assumed_spent' | 'manual_track'>(item?.tracking_mode || 'manual_track')

  const [period, setPeriod] = useState<'day' | 'week' | 'month'>(item?.allocated_period || 'week')

  const [desc, setDesc] = useState(item?.description || '')
  const maxDesc = 800

  const [title, setTitle] = useState(item?.title || '')
  const maxTitle = 50

  const [isDeleting, startTransition] = useTransition()

  const handleDelete = () => {
    if (!item?.id) return
    if (window.confirm('Are you sure you want to remove this task? It will be archived in your History.')) {
      startTransition(async () => {
        const result = await deleteItem(item.id)
        if (result?.error) {
          alert(result.error)
        }
      })
    }
  }

  const [state, formAction, pending] = useActionState(async (prevState: any, formData: FormData) => {
    // Add period to formdata explicitly if needed, but it's an input.
    const result = isEdit ? await updateItem(item!.id, formData) : await createItem(formData)
    if (result?.error) {
      return { error: result.error }
    }
    return { error: null }
  }, { error: null })

  return (
    <form action={formAction} className="space-y-6 bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={maxTitle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm transition-colors ${title.length >= maxTitle
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-zinc-700'
              }`}
            placeholder={`e.g. Client X, Family Time, Sleep (max ${maxTitle} chars)`}
          />
          <div className="mt-1 flex justify-end">
            <span className={`text-xs ${title.length >= maxTitle ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-zinc-400'}`}>
              {title.length >= maxTitle ? 'Character limit reached' : `${maxTitle - title.length} characters remaining`}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={maxDesc}
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm transition-colors ${desc.length >= maxDesc
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-zinc-700'
              }`}
            placeholder="Add more details about this item... (max 800 chars)"
          />
          <div className="mt-1 flex justify-end">
            <span className={`text-xs ${desc.length >= maxDesc ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-zinc-400'}`}>
              {desc.length >= maxDesc ? 'Character limit reached' : `${maxDesc - desc.length} characters remaining`}
            </span>
          </div>
        </div>

        <div>
          <label htmlFor="link" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
            Link (Optional)
          </label>
          <input
            id="link"
            name="link"
            type="url"
            defaultValue={item?.link || ''}
            className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm"
            placeholder="https://..."
          />
        </div>

        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 dark:text-zinc-300">Tracking Mode</legend>
          <div className="mt-2 flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="tracking_mode"
                value="manual_track"
                checked={trackingMode === 'manual_track'}
                onChange={() => setTrackingMode('manual_track')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-zinc-300">Manual track (timer)</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="tracking_mode"
                value="assumed_spent"
                checked={trackingMode === 'assumed_spent'}
                onChange={() => setTrackingMode('assumed_spent')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-zinc-300">Assumed spent</span>
            </label>
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="allocated_hours" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Allocated Time <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex space-x-2">
              <input
                id="allocated_hours"
                name="allocated_hours"
                type="number"
                step="0.1"
                min="0.1"
                required
                defaultValue={item?.allocated_hours}
                className="block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm"
                placeholder="e.g. 10.5"
              />
              <span className="flex items-center text-gray-500 dark:text-zinc-400">per</span>
              <select
                name="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as 'day' | 'week' | 'month')}
                className="rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              End Date (Optional)
            </label>
            <input
              id="end_date"
              name="end_date"
              type="date"
              defaultValue={item?.end_date ? new Date(item.end_date).toISOString().split('T')[0] : ''}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm"
            />
          </div>
        </div>

        {trackingMode === 'manual_track' && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <label htmlFor="notice_period_days" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Notice Period (Days)
              </label>
              <div className="group relative flex items-center">
                <svg className="w-4 h-4 text-gray-400 hover:text-gray-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="absolute bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 w-64 sm:w-72 p-3 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white border border-gray-200 dark:border-zinc-700 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                  <p className="mb-2"><strong>0 = Free at will.</strong> The number of days notice required to drop this commitment.</p>
                  <p>Items with a 0-day notice period are considered flexible. Their hours are included in your <strong>Potentially Available</strong> time on your public page.</p>
                  <div className="absolute top-full left-4 sm:left-1/2 sm:-translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-zinc-800"></div>
                </div>
              </div>
            </div>
            <input
              id="notice_period_days"
              name="notice_period_days"
              type="number"
              min="0"
              step="1"
              required={trackingMode === 'manual_track'}
              defaultValue={item?.notice_period_days ?? 0}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm"
            />
          </div>
        )}
      </div>

      {state.error && (
        <div className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          {state.error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          {isEdit && !isArchived && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || pending}
              className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? 'Removing...' : 'Remove'}
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          <Link
            href="/"
            className="py-2 px-4 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending || isDeleting}
            className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Saving...' : isEdit ? (isArchived ? 'Add Back' : 'Update Item') : 'Create Item'}
          </button>
        </div>
      </div>
    </form>
  )
}
