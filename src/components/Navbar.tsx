'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'

export default function Navbar({ profile }: { profile: any }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const showDashboard = pathname !== '/'
  const showHistory = pathname !== '/history'
  const showSettings = pathname !== '/settings'

  const handleLogout = (e: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm("Are you sure you want to log out?")) {
      e.preventDefault()
    }
  }

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-40">
      <div className="px-4 py-3 max-w-5xl mx-auto flex justify-between items-center relative z-50">
        <Link href="/" className="flex items-center z-50">
          <img src="/logo.png" alt="Time Tracker Logo" className="h-10 sm:h-12 w-auto object-contain" />
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            {showDashboard && (
              <Link href="/" className="text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Dashboard
              </Link>
            )}
            {showHistory && (
              <Link href="/history" className="text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                History
              </Link>
            )}
            {showSettings && (
              <Link href="/settings" className="text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Settings
              </Link>
            )}
            <Link href={`/${profile.slug}`} target="_blank" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              Public Page ↗
            </Link>
          </div>
          
          <div className="flex items-center space-x-4 border-l border-gray-200 dark:border-zinc-700 pl-6">
            <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium">
              {profile.display_name}
            </span>
            <form action={signOut} onSubmit={handleLogout}>
              <button type="submit" className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors cursor-pointer">
                Log out
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Hamburger */}
        <button 
          className="sm:hidden p-2 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="sm:hidden absolute top-full left-0 w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-lg flex flex-col z-40">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
            <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium">
              {profile.display_name}
            </span>
            <Link href={`/${profile.slug}`} target="_blank" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors" onClick={() => setIsOpen(false)}>
              Public Page ↗
            </Link>
          </div>
          
          <div className="flex flex-col p-2 space-y-1">
            {showDashboard && (
              <Link href="/" className="px-3 py-3 text-base font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg" onClick={() => setIsOpen(false)}>
                Dashboard
              </Link>
            )}
            {showHistory && (
              <Link href="/history" className="px-3 py-3 text-base font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg" onClick={() => setIsOpen(false)}>
                History
              </Link>
            )}
            {showSettings && (
              <Link href="/settings" className="px-3 py-3 text-base font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg" onClick={() => setIsOpen(false)}>
                Settings
              </Link>
            )}
            <div className="px-3 py-3 mt-2 border-t border-gray-100 dark:border-zinc-800">
              <form action={signOut} onSubmit={handleLogout}>
                <button type="submit" className="text-base text-red-600 hover:text-red-700 font-medium w-full text-left">
                  Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
