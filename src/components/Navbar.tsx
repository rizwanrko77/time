'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'

export default function Navbar({ profile }: { profile: any }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: 'Dashboard', href: '/', isActive: pathname === '/' || pathname.startsWith('/items') },
    { label: 'History', href: '/history', isActive: pathname === '/history' },
    { label: 'Settings', href: '/settings', isActive: pathname === '/settings' },
  ]

  const handleLogout = (e: React.FormEvent<HTMLFormElement>) => {
    if (!window.confirm("Are you sure you want to log out?")) {
      e.preventDefault()
    }
  }

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-40">
      <div className="px-4 py-2.5 max-w-5xl mx-auto flex justify-between items-center relative z-50">
        <Link href="/" className="flex items-center z-50 shrink-0">
          <img src="/logo.png" alt="TIME Logo" className="h-10 sm:h-11 w-auto object-contain" />
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center space-x-6">
          <div className="flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  item.isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-semibold'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={`/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors inline-flex items-center gap-1"
            >
              Public Page ↗
            </Link>
          </div>
          
          <div className="flex items-center space-x-4 border-l border-gray-200 dark:border-zinc-700 pl-5">
            <span className="text-sm text-gray-700 dark:text-zinc-300 font-medium truncate max-w-[140px]" title={profile.display_name}>
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
          aria-label="Toggle navigation menu"
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
        <div className="sm:hidden absolute top-full left-0 w-full bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 shadow-lg flex flex-col z-40 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/30">
            <span className="text-sm text-gray-700 dark:text-zinc-300 font-semibold truncate">
              {profile.display_name}
            </span>
            <Link 
              href={`/${profile.slug}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-md transition-colors" 
              onClick={() => setIsOpen(false)}
            >
              Public Page ↗
            </Link>
          </div>
          
          <div className="flex flex-col p-2 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  item.isActive
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 font-semibold'
                    : 'text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            <div className="pt-2 mt-1 border-t border-gray-100 dark:border-zinc-800">
              <form action={signOut} onSubmit={handleLogout}>
                <button type="submit" className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium w-full text-left rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
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
