import { redirect } from 'next/navigation'

export default async function SavedPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  redirect(tab === 'journal' ? '/trips?tab=journal' : '/trips')
}
