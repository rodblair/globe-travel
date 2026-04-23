import { redirect } from 'next/navigation'

export default function JournalPage() {
  redirect('/saved?tab=journal')
}
