import Link from 'next/link'
import type { Metadata } from 'next'
import { PublicFooter } from '@/components/PublicFooter'
import { PublicNavbar } from '@/components/PublicNavbar'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for TIME — how we handle your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <PublicNavbar maxWidthClass="max-w-3xl" />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8">Last updated: July 9, 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-zinc-300 text-sm leading-relaxed">
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">1. Introduction</h2>
            <p>
              TIME (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a time-allocation and availability-sharing tool operated by iamrizwan.com. 
              This Privacy Policy explains how we collect, use, and protect your personal data in compliance with the 
              General Data Protection Regulation (GDPR) and other applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">2. Data We Collect</h2>
            <p>We collect only the minimum data necessary to provide our service:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Email address</strong> — used for account authentication and login.</li>
              <li><strong>Display name</strong> — shown on your profile and public availability page.</li>
              <li><strong>Time allocation data</strong> — the tasks, hours, and time entries you create within the app.</li>
            </ul>
            <p className="mt-3">We do <strong>not</strong> collect:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Payment or financial information</li>
              <li>Location data</li>
              <li>Device fingerprints or advertising identifiers</li>
              <li>Data from third-party sources</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To authenticate your account and maintain your session.</li>
              <li>To display your time allocations and availability on your personal dashboard.</li>
              <li>To render your public availability page (if you choose to make it public).</li>
            </ul>
            <p className="mt-3">We do not use your data for advertising, profiling, or any purpose beyond operating the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">4. Data Storage & Security</h2>
            <p>
              Your data is stored securely on <strong>Supabase</strong> (powered by PostgreSQL) with Row Level Security (RLS) 
              enabled on all tables. This ensures that each user can only access their own data. All data is transmitted 
              over HTTPS (TLS encryption in transit).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">5. Cookies</h2>
            <p>
              We use only <strong>essential authentication cookies</strong> to maintain your login session. We do not use 
              tracking cookies, analytics cookies, or any third-party cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">6. Data Sharing</h2>
            <p>
              We do <strong>not</strong> sell, rent, or share your personal data with any third parties. Your public 
              availability page displays only the information you choose to make public (task names, allocated hours, 
              and availability). Your email address is never displayed publicly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">7. Data Retention & Deletion</h2>
            <p>
              Your data is retained only for as long as your account exists. When you delete your account through the 
              &quot;Danger Zone&quot; in Settings, <strong>all of your data is permanently and immediately deleted</strong>, including:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Your profile and display name</li>
              <li>Your email from our authentication system</li>
              <li>All tasks, time entries, and call-to-action data</li>
              <li>Your public availability page</li>
            </ul>
            <p className="mt-3">This deletion is irreversible. We do not retain backups of deleted user data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">8. Your Rights (GDPR)</h2>
            <p>Under the GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li><strong>Access</strong> — View all data we hold about you (visible in your dashboard and settings).</li>
              <li><strong>Rectification</strong> — Update your data at any time through Settings.</li>
              <li><strong>Erasure</strong> — Delete your account and all associated data instantly.</li>
              <li><strong>Data portability</strong> — Your data is accessible via your dashboard.</li>
              <li><strong>Withdraw consent</strong> — You can delete your account at any time without restriction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">9. Children&apos;s Privacy</h2>
            <p>
              Our service is not directed at children under the age of 16. We do not knowingly collect personal data 
              from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an 
              updated &quot;Last updated&quot; date. Continued use of the service after changes constitutes acceptance of the 
              updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">11. Contact</h2>
            <p>
              If you have any questions about this Privacy Policy or your data, please contact us at{' '}
              <a href="https://iamrizwan.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                iamrizwan.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter className="mt-12" maxWidthClass="max-w-3xl" />
    </div>
  )
}
