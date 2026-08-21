'use client'

import { useActionState, useState, useEffect } from 'react'
import { verifyRegistration, resendVerification } from '@/app/actions/auth'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function RegisterVerifyContent() {
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ''
  
  const [cooldown, setCooldown] = useState(60)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  const [state, formAction, pending] = useActionState(async (prevState: any, formData: FormData) => {
    const result = await verifyRegistration(formData)
    if (result?.error) {
      return { error: result.error }
    }
    return { error: null }
  }, { error: null })

  // Cooldown timer logic
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleResend = async () => {
    if (cooldown > 0 || isResending || !email) return
    setIsResending(true)
    setResendMessage('')
    
    const formData = new FormData()
    formData.append('email', email)
    
    const result = await resendVerification(formData)
    
    if (result?.error) {
      setResendMessage(result.error)
    } else {
      setResendMessage('Verification code resent successfully!')
      setCooldown(60) // Reset cooldown
    }
    setIsResending(false)
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invalid Request</h2>
          <p className="text-gray-600 dark:text-zinc-400">No email address provided for verification.</p>
          <Link href="/register" className="text-blue-600 hover:underline inline-block mt-4">Go back to Registration</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800">
        <div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Verify your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-zinc-400">
            We sent a verification code to <strong>{email}</strong>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" action={formAction}>
          <input type="hidden" name="email" value={email} />
          
          <div className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Verification Code
              </label>
              <input
                id="token"
                name="token"
                type="text"
                required
                maxLength={8}
                autoComplete="one-time-code"
                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-zinc-700 px-3 py-3 text-center tracking-widest text-xl font-mono bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="12345678"
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
            {pending ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <button 
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className={`text-sm font-medium transition-colors ${
              cooldown > 0 
                ? 'text-gray-400 dark:text-zinc-500 cursor-not-allowed' 
                : 'text-blue-600 hover:text-blue-500'
            }`}
          >
            {isResending ? 'Sending...' : cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
          
          {resendMessage && (
            <p className={`text-xs ${resendMessage.includes('error') || resendMessage.includes('wait') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
              {resendMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RegisterVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950 px-4">
      <div className="text-gray-500">Loading...</div>
    </div>}>
      <RegisterVerifyContent />
    </Suspense>
  )
}
