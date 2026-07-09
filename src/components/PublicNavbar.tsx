import Link from 'next/link'

type Props = {
  className?: string
  maxWidthClass?: string
}

export function PublicNavbar({ className = '', maxWidthClass = 'max-w-5xl' }: Props) {
  return (
    <nav className={`bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-40 ${className}`}>
      <div className={`${maxWidthClass} mx-auto px-4 py-3 flex justify-between items-center`}>
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="TIME Logo" className="h-10 sm:h-12 w-auto object-contain" />
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}
