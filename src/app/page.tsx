import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function Home() {
  const cookieStore = cookies()
  const authCookie = cookieStore.get('auth')

  // If authenticated, redirect to dashboard
  if (authCookie?.value === 'true') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-8">
      <h1 className="text-4xl font-bold text-brand-orange mb-4 text-center">Dacha SSI Smart Gym Monitoring Solutions</h1>
      <p className="text-lg text-gray-700 mb-8 text-center max-w-2xl">
        This dashboard provides real-time monitoring, reporting, and management for your gym environment. Use the links below to navigate to each section.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
        <Link href="/dashboard" className="block bg-brand-orange text-white font-semibold py-4 px-6 rounded-lg shadow hover:bg-orange-600 text-center transition">Dashboard</Link>
        <Link href="/reporting" className="block bg-brand-orange text-white font-semibold py-4 px-6 rounded-lg shadow hover:bg-orange-600 text-center transition">Reporting</Link>
        <Link href="/site-drawing" className="block bg-brand-orange text-white font-semibold py-4 px-6 rounded-lg shadow hover:bg-orange-600 text-center transition">Site Drawings & Video</Link>
        <Link href="/data-flow" className="block bg-brand-orange text-white font-semibold py-4 px-6 rounded-lg shadow hover:bg-orange-600 text-center transition">Data Flow</Link>
        <Link href="/info" className="block bg-brand-orange text-white font-semibold py-4 px-6 rounded-lg shadow hover:bg-orange-600 text-center transition">Info & User Guide</Link>
        <Link href="/user-log" className="block bg-brand-orange text-white font-semibold py-4 px-6 rounded-lg shadow hover:bg-orange-600 text-center transition">User Log & Audit Trail</Link>
      </div>
    </div>
  )
} 