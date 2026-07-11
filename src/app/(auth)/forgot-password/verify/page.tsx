'use client'

import { useActionState, useState, useEffect } from 'react'
import { resetPasswordWithOtp } from '@/app/actions/auth'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordVerifyPage() {
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ''
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [isOtpVerified, setIsOtpVerified] = useState(false)

  // Declare useActionState first so we can use its state in the useEffect dependency array
  const [state, formAction, pending] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await resetPasswordWithOtp(formData)
    if (result?.error) {
      return { error: result.error }
    }
    return { error: null }
  }, { error: null })

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user && user.email === email) {
        setIsOtpVerified(true)
      }
    }
    checkSession()
  }, [email, state])

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invalid Request</h2>
          <p className="text-gray-600 dark:text-zinc-400">No email address provided for recovery.</p>
          <Link href="/forgot-password" className="text-blue-600 hover:underline inline-block mt-4">Go back to Reset Password</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {isOtpVerified ? 'Enter New Password' : 'Verify & Set Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-zinc-400">
            {isOtpVerified 
              ? 'Your email has been verified. Choose a strong new password.' 
              : <span>We sent a 6-digit recovery code to <strong>{email}</strong></span>}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" action={formAction}>
          <input type="hidden" name="email" value={email} />
          
          <div className="space-y-4">
            {isOtpVerified ? (
              <input type="hidden" name="token" value="000000" />
            ) : (
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                  6-Digit Recovery Code
                </label>
                <input
                  id="token"
                  name="token"
                  type="text"
                  required
                  maxLength={6}
                  autoComplete="one-time-code"
                  className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-3 text-center tracking-widest text-xl font-mono bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="123456"
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                New Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="block w-full rounded-lg border border-gray-300 dark:border-zinc-700 pl-3 pr-10 py-2 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                  placeholder="Minimum 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Realtime Password Validation */}
              <div className="mt-3 space-y-2 text-xs">
                <div className={`flex items-center gap-2 ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-zinc-500'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    {password.length >= 8 ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
                  </svg>
                  At least 8 characters
                </div>
                <div className={`flex items-center gap-2 ${/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-zinc-500'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    {/[A-Z]/.test(password) ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
                  </svg>
                  One uppercase letter
                </div>
                <div className={`flex items-center gap-2 ${/[a-z]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-zinc-500'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    {/[a-z]/.test(password) ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
                  </svg>
                  One lowercase letter
                </div>
                <div className={`flex items-center gap-2 ${/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-zinc-500'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    {/[0-9]/.test(password) ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
                  </svg>
                  One number
                </div>
                <div className={`flex items-center gap-2 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-zinc-500'}`}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password) ? <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />}
                  </svg>
                  One special character
                </div>
              </div>
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
            {pending ? 'Updating...' : 'Securely Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
