'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { updateSettings } from '@/app/actions/settings'
import { deleteAccount } from '@/app/actions/auth'
import { Profile, CTA } from '@/lib/types'
import Link from 'next/link'

type Props = {
  profile: Profile
  cta: CTA
  origin: string
  email: string
}

export function SettingsForm({ profile, cta, origin, email }: Props) {
  const [mounted, setMounted] = useState(false)
  const [slug, setSlug] = useState(profile.slug)
  const [copied, setCopied] = useState(false)
  const [tz, setTz] = useState(profile.timezone || 'UTC')
  const [ctaDesc, setCtaDesc] = useState(cta.description || '')
  const maxCtaDesc = 500

  const [pageTitle, setPageTitle] = useState(profile.page_title || '')
  const maxPageTitle = 60

  const [pageDesc, setPageDesc] = useState(profile.page_desc || '')
  const maxPageDesc = 2000

  const [ctaTitle, setCtaTitle] = useState(cta.title || '')
  const maxCtaTitle = 60

  const [showDangerZone, setShowDangerZone] = useState(false)
  const [confirmDeleteText, setConfirmDeleteText] = useState('')
  const [isDeleting, startTransition] = useTransition()

  const handleDeleteAccount = () => {
    if (confirmDeleteText !== 'DELETE') return;
    startTransition(async () => {
      await deleteAccount()
    })
  }

  const timezones = Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 
    'Europe/London', 'Europe/Paris', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 
    'Asia/Tokyo', 'Australia/Sydney'
  ];

  useEffect(() => {
    setMounted(true)
    // If the database has UTC but the user hasn't actively set it, try to auto-detect
    if (profile.timezone === 'UTC') {
      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (detected) setTz(detected)
      } catch (e) {
        // ignore
      }
    }
  }, [profile.timezone])

  const [state, formAction, pending] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await updateSettings(formData)
    if (result?.error) {
      return { error: result.error, success: false }
    }
    return { error: null, success: true }
  }, { error: null, success: false })

  const embedCode = `<iframe src="${origin}/${slug}?view=${profile.default_view}"
        style="width:100%;max-width:640px;height:520px;border:0;"
        loading="lazy" title="My availability"></iframe>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      <form action={formAction} className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile Settings</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Email ID
            </label>
            <input
              type="text"
              readOnly
              value={email}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-gray-400 sm:text-sm cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Display Name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              defaultValue={profile.display_name}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              URL Slug
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.replace(/[^a-z0-9-]/g, ''))}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              {origin}/{slug}
            </p>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="page_title" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Public Page Title
            </label>
            <input
              id="page_title"
              name="page_title"
              type="text"
              required
              maxLength={maxPageTitle}
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm transition-colors ${
                pageTitle.length >= maxPageTitle 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 dark:border-zinc-700'
              }`}
            />
            <div className="mt-1 flex justify-end">
              <span className={`text-xs ${pageTitle.length >= maxPageTitle ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-zinc-400'}`}>
                {pageTitle.length >= maxPageTitle ? 'Character limit reached' : `${maxPageTitle - pageTitle.length} characters remaining`}
              </span>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="page_desc" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Public Page Description
            </label>
            <textarea
              id="page_desc"
              name="page_desc"
              rows={3}
              required
              maxLength={maxPageDesc}
              value={pageDesc}
              onChange={(e) => setPageDesc(e.target.value)}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm transition-colors ${
                pageDesc.length >= maxPageDesc 
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 dark:border-zinc-700'
              }`}
            />
            <div className="mt-1 flex justify-end">
              <span className={`text-xs ${pageDesc.length >= maxPageDesc ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-zinc-400'}`}>
                {pageDesc.length >= maxPageDesc ? 'Character limit reached' : `${maxPageDesc - pageDesc.length} characters remaining`}
              </span>
            </div>
          </div>
          <div>
            <label htmlFor="default_view" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Default View
            </label>
            <select
              id="default_view"
              name="default_view"
              defaultValue={profile.default_view}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div>
            <label htmlFor="auto_stop_timer_hours" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Auto-stop Timers After (Hours)
            </label>
            <input
              id="auto_stop_timer_hours"
              name="auto_stop_timer_hours"
              type="number"
              min="1"
              max="720"
              required
              defaultValue={profile.auto_stop_timer_hours || 8}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              Timezone
            </label>
            <select
              id="timezone"
              name="timezone"
              value={tz}
              onChange={(e) => setTz(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm"
            >
              {mounted ? timezones.map((t) => (
                <option key={t} value={t}>{t}</option>
              )) : (
                <option value={tz}>{tz}</option>
              )}
            </select>
          </div>
          <div className="flex items-center sm:col-span-2">
            <input
              id="is_public"
              name="is_public"
              type="checkbox"
              defaultChecked={profile.is_public}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700 dark:text-zinc-300">
              Make my availability page public
            </label>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-zinc-800 pt-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Call to Action (Optional)</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="cta_title" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                CTA Title
              </label>
              <input
                id="cta_title"
                name="cta_title"
                type="text"
                maxLength={maxCtaTitle}
                value={ctaTitle}
                onChange={(e) => setCtaTitle(e.target.value)}
                placeholder={`Let's work together (max ${maxCtaTitle} chars)`}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm transition-colors ${
                  ctaTitle.length >= maxCtaTitle 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-zinc-700'
                }`}
              />
              <div className="mt-1 flex justify-end">
                <span className={`text-xs ${ctaTitle.length >= maxCtaTitle ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-zinc-400'}`}>
                  {ctaTitle.length >= maxCtaTitle ? 'Character limit reached' : `${maxCtaTitle - ctaTitle.length} characters remaining`}
                </span>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cta_description" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                CTA Description
              </label>
              <textarea
                id="cta_description"
                name="cta_description"
                rows={3}
                maxLength={maxCtaDesc}
                value={ctaDesc}
                onChange={(e) => setCtaDesc(e.target.value)}
                placeholder={`Book a meeting with me (max ${maxCtaDesc} chars)`}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm transition-colors ${
                  ctaDesc.length >= maxCtaDesc 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 dark:border-zinc-700'
                }`}
              />
              <div className="mt-1 flex justify-end">
                <span className={`text-xs ${ctaDesc.length >= maxCtaDesc ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-zinc-400'}`}>
                  {ctaDesc.length >= maxCtaDesc ? 'Character limit reached' : `${maxCtaDesc - ctaDesc.length} characters remaining`}
                </span>
              </div>
            </div>
            <div>
              <label htmlFor="cta_url" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                CTA Link URL
              </label>
              <input
                id="cta_url"
                name="cta_url"
                type="url"
                defaultValue={cta.url || ''}
                placeholder="https://cal.com/..."
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm"
              />
            </div>
          </div>
        </div>

        {state.error && (
          <div className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {state.error}
          </div>
        )}
        {state.success && (
          <div className="text-green-600 text-sm font-medium bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            Settings saved successfully.
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Link
            href="/"
            className="py-2 px-4 border border-gray-300 dark:border-zinc-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Back to Dashboard
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {pending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Embed Code</h2>
        <p className="text-sm text-gray-600 dark:text-zinc-400">
          Copy this snippet to embed your availability on your personal website or notion page.
        </p>
        <pre className="bg-gray-50 dark:bg-zinc-950 p-4 rounded-lg text-sm text-gray-800 dark:text-zinc-300 overflow-x-auto border border-gray-200 dark:border-zinc-800">
          <code>{embedCode}</code>
        </pre>
        <button
          onClick={handleCopy}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-zinc-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy Snippet'}
        </button>
        <div className="mt-4">
          <a href={`/${slug}`} target="_blank" className="text-sm font-medium text-blue-600 hover:underline">
            View Public Page &rarr;
          </a>
        </div>
      </div>

      <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-200 dark:border-red-900/50 shadow-sm space-y-4 mt-8">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Danger Zone</h2>
        <p className="text-sm text-gray-700 dark:text-zinc-300">
          Permanently delete your account and all of its associated data. This action cannot be undone.
        </p>
        
        {!showDangerZone ? (
          <button
            onClick={() => setShowDangerZone(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-800 shadow-sm text-sm font-medium rounded-md text-red-700 dark:text-red-400 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="space-y-4 bg-white dark:bg-zinc-900 p-4 rounded-lg border border-red-200 dark:border-red-900/50">
            <label htmlFor="confirm_delete" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              To verify, type <strong>DELETE</strong> below:
            </label>
            <input
              id="confirm_delete"
              type="text"
              value={confirmDeleteText}
              onChange={(e) => setConfirmDeleteText(e.target.value)}
              placeholder="DELETE"
              className="mt-1 block w-full rounded-lg border border-red-300 dark:border-red-900/50 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white sm:text-sm focus:ring-red-500 focus:border-red-500"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDangerZone(false)
                  setConfirmDeleteText('')
                }}
                className="px-4 py-2 border border-gray-300 dark:border-zinc-700 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={confirmDeleteText !== 'DELETE' || isDeleting}
                className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors flex items-center"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
