'use client'

import { useActionState } from 'react'
import { requestPasswordReset } from '@/app/actions/auth'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await requestPasswordReset(formData)
    if (result?.error) {
      return { error: result.error }
    }
    return { error: null }
  }, { error: null })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-zinc-400">
            Enter your email address to receive a recovery code
          </p>
        </div>
        
        <form className="mt-8 space-y-6" action={formAction}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>
          </div>

          {state.error && (
            <div className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Sending code...' : 'Send Recovery Code'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
