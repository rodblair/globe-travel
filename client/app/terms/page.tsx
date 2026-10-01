import type { Metadata } from 'next'
import { LegalPage } from '@/components/marketing/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when you use Globe.travel.',
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="October 1, 2026">
      <section>
        <h2>Using Globe.travel</h2>
        <p>
          Globe.travel helps you plan trips, build itineraries on a map and share them with friends. By using the
          service you agree to these terms. If you do not agree, please do not use it.
        </p>
      </section>
      <section>
        <h2>Your account</h2>
        <p>
          You can use Globe.travel as a guest or with an account. You are responsible for activity on your account and
          for keeping your sign-in details safe. Guest sessions are temporary and may be removed after a period of
          inactivity, so create an account to keep your trips.
        </p>
      </section>
      <section>
        <h2>Your content</h2>
        <p>
          You own the trips, notes and feedback you create. You give us permission to store and display them so we can
          run the service, including showing a trip to anyone you share its link with. You can delete your trips at any
          time.
        </p>
      </section>
      <section>
        <h2>Shared links and feedback</h2>
        <p>
          Anyone with a share link can view that trip and may leave feedback. Do not share a link publicly if you do not
          want the trip to be seen. Please do not post unlawful, abusive or misleading content in feedback.
        </p>
      </section>
      <section>
        <h2>AI-generated plans</h2>
        <p>
          Itineraries are suggestions generated with the help of AI and third-party data. Opening hours, prices and
          availability can change, so check details with the venue or provider before you travel or book. We do not
          guarantee that a plan is accurate, complete or suitable for you.
        </p>
      </section>
      <section>
        <h2>Plans and billing</h2>
        <ul>
          <li>Explorer is free and has usage limits shown on the pricing page.</li>
          <li>Adventurer is a paid subscription billed monthly or yearly, and may include a free trial.</li>
          <li>You can cancel at any time from your account. Cancellation takes effect at the end of the billing period.</li>
        </ul>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not misuse the service, attempt to access other people&apos;s data, overload our systems, or use automated
          means to scrape the service.
        </p>
      </section>
      <section>
        <h2>Changes and contact</h2>
        <p>
          We may update these terms and will post the new date here. Continuing to use Globe.travel after a change means
          you accept the update. Questions? Contact us through the address listed in your account settings or on our
          website.
        </p>
      </section>
    </LegalPage>
  )
}
