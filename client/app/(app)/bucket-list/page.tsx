import { redirect } from 'next/navigation'

export default function BucketListPage() {
  redirect('/saved?tab=bucket')
}
