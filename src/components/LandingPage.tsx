import Link from 'next/link'
import { PublicFooter } from '@/components/PublicFooter'
import { PublicNavbar } from '@/components/PublicNavbar'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      {/* Navbar */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 py-20 sm:py-28 text-center">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
          Know where your time goes.
          <br />
          <span className="text-blue-600">Share when you're free.</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Allocate your hours across jobs, freelance gigs, and side projects.
          Track your time with a built-in timer. Share a live availability page
          so clients and collaborators know exactly when you're available.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link href="/register" className="w-full sm:w-auto px-8 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
            Start for free
          </Link>
          <Link href="/login" className="w-full sm:w-auto px-8 py-3 text-base font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            Sign in
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Allocate</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
              Assign hours per day, week, or month to each commitment. See your remaining capacity at a glance.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Track</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
              Use the built-in timer to log hours on manual-track tasks. View completion rates over 7, 30, and 90 days.
            </p>
          </div>

          {/* Feature 3: Log Notes */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Log Notes</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
              Keep detailed logs of what you worked on during each session. Easily review your history and refer back to past tasks.
            </p>
          </div>

          {/* Feature 4: Speak to Write */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Speak to Write</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
              Tired of typing? Use our advanced real-time voice dictation to speak your notes in over 50 languages and dialects.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Share</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
              Get a unique public page showing your availability. Clients and collaborators see how many hours you have free.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Embed</h3>
            <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed">
              Copy a simple code snippet to embed your availability on your personal website or portfolio.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white dark:bg-zinc-900 border-y border-gray-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 py-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Add your commitments</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400">List your jobs, freelance gigs, learning goals — anything that takes your time.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Set hours & track</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Allocate hours per week or month. Optionally use the timer to track actual time spent.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Share your availability</h3>
              <p className="text-sm text-gray-600 dark:text-zinc-400">Your public page auto-updates to show exactly how many free hours you have.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-5xl mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to take control of your time?</h2>
        <p className="text-gray-600 dark:text-zinc-400 mb-8 max-w-lg mx-auto">
          Free to use forever. No credit card required. Set up in under a minute.
        </p>
        <Link href="/register" className="inline-block px-8 py-3 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
          Get Started — It's Free
        </Link>
      </section>

      {/* Footer */}
      <PublicFooter />
    </div>
  )
}
