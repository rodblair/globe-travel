import { redirect } from 'next/navigation'

type LegacySharePageProps = {
  params: Promise<{ shareSlug: string }>
}

export default async function LegacySharePage({ params }: LegacySharePageProps) {
  const { shareSlug } = await params
  redirect(`/t/${shareSlug}`)
}
