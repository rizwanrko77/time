import Link from 'next/link'

type Props = {
  className?: string
  maxWidthClass?: string
}

export function PublicFooter({ className = '', maxWidthClass = 'max-w-5xl' }: Props) {
  return (
    <footer className={`bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 ${className}`}>
      <div className={`${maxWidthClass} mx-auto px-4 py-8 flex flex-col sm:flex-row justify-between items-center gap-4`}>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          © {new Date().getFullYear()} TIME by <a href="https://iamrizwan.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">iamrizwan.com</a>
        </p>
        <div className="flex items-center space-x-6">
          <Link href="/privacy" className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  )
}
