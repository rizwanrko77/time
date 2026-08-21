import Link from 'next/link'
import type { Metadata } from 'next'
import { PublicFooter } from '@/components/PublicFooter'
import { PublicNavbar } from '@/components/PublicNavbar'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for TIME — rules and guidelines for using our platform.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950">
      <PublicNavbar maxWidthClass="max-w-3xl" />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-8">Last updated: July 9, 2026</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-zinc-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">1. Acceptance of Terms</h2>
            <p>
              By creating an account or using TIME (&quot;the Service&quot;), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service. The Service is operated by rkospl.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">2. Description of Service</h2>
            <p>
              TIME is a free time-allocation and availability-sharing tool that allows you to:
            </p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Allocate your available hours across commitments (jobs, projects, etc.).</li>
              <li>Track time spent on tasks using a built-in timer.</li>
              <li>Share a public availability page with a unique URL.</li>
              <li>Embed your availability on external websites.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">3. User Accounts</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide a valid email address and display name to create an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must not create accounts for the purpose of abuse, spam, or any illegal activity.</li>
              <li>One person may maintain one account. Duplicate accounts may be removed.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">4. User Content & Responsibilities</h2>
            <p>
              You retain full ownership of all data you enter into the Service (task names, descriptions, time entries, etc.). 
              By making your availability page public, you grant us a limited license to display that content to visitors 
              of your public page.
            </p>
            <p className="mt-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-2">
              <li>Use the Service for any unlawful purpose.</li>
              <li>Post content that is offensive, defamatory, or infringes on others&apos; rights.</li>
              <li>Attempt to access other users&apos; data or interfere with the Service&apos;s operation.</li>
              <li>Use automated tools to scrape or extract data from the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">5. Account Termination</h2>
            <p>
              You may delete your account at any time from the Settings page. Upon deletion, all of your data is 
              permanently and immediately removed from our systems as described in our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
            </p>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that violate these terms or are used for abusive purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">6. Service Availability</h2>
            <p>
              We strive to keep the Service available at all times, but we do not guarantee uninterrupted access. 
              The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">7. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. 
              To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, 
              consequential, or punitive damages arising from your use of the Service.
            </p>
            <p className="mt-3">
              We are not responsible for any decisions you make based on the time data displayed by the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">8. Intellectual Property</h2>
            <p>
              The Service, including its design, code, and branding, is the property of rkospl.com. You may not 
              copy, modify, or distribute any part of the Service without prior written consent. Your data remains yours — 
              we claim no ownership over the content you create.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">9. Changes to Terms</h2>
            <p>
              We may update these Terms of Service from time to time. Changes will be reflected on this page with an 
              updated date. Continued use of the Service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">10. Contact</h2>
            <p>
              If you have any questions about these Terms, please contact us at{' '}
              <a href="https://rkospl.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                rkospl.com
              </a>.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter className="mt-12" maxWidthClass="max-w-3xl" />
    </div>
  )
}
