import type { Metadata } from 'next'
import { LegalPage } from '@/components/marketing/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Globe.travel collects, uses and protects your information.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 1, 2026">
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account details such as your name, email address and profile information.</li>
          <li>Trips, itineraries, notes and feedback you create or submit.</li>
          <li>Messages you send to the planner so it can respond and improve your plan.</li>
          <li>Basic usage and device information, such as pages visited and browser type.</li>
          <li>Billing status from our payment provider. We do not store full card numbers.</li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <p>
          We use your information to run Globe.travel, generate and map itineraries, let you share trips, process
          payments, keep the service secure and understand how it is used so we can improve it.
        </p>
      </section>
      <section>
        <h2>Who we share it with</h2>
        <p>
          We use trusted service providers to operate the product, including hosting and database, AI model providers,
          mapping, payments and analytics. They only receive the information needed to provide their service. When you
          share a trip link, anyone with the link can view that trip. We do not sell your personal information.
        </p>
      </section>
      <section>
        <h2>Guest sessions and cookies</h2>
        <p>
          We use cookies to keep you signed in, remember guest sessions and measure usage. You can clear cookies in your
          browser, but some features may stop working.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          You can edit your profile, delete trips and notes, and make shared trips private at any time. To close your
          account or request a copy or deletion of your data, contact us using the details in your account settings.
        </p>
      </section>
      <section>
        <h2>Changes</h2>
        <p>We may update this policy and will post the new date here.</p>
      </section>
    </LegalPage>
  )
}
