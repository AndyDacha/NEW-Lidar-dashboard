import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Lidar Dashboard',
  description: 'Smart Gym Monitoring Solutions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const isLoginPage = pathname === '/login';

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          {/* Hover-triggered side menu */}
          {!isLoginPage && (
            <div className="group fixed left-0 top-0 h-full z-50">
              {/* Menu trigger button */}
              <button className="absolute left-0 top-4 bg-brand-orange text-white p-2 rounded-r-lg shadow-lg hover:bg-brand-orange/90 transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {/* Menu panel */}
              <div className="absolute left-0 top-0 h-full w-56 bg-brand-grey transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out shadow-xl">
                <div className="p-6">
                  <h2 className="text-xl font-bold text-white mb-8">Dashboard</h2>
                  <nav className="space-y-4">
                    <Link href="/dashboard" className="block text-white hover:text-brand-orange transition-colors duration-200">
                      Home
                    </Link>
                    <Link href="/reporting" className="block text-white hover:text-brand-orange transition-colors duration-200">
                      Reporting
                    </Link>
                    <Link href="/site-drawing" className="block text-white hover:text-brand-orange transition-colors duration-200">
                      Site Drawings & Video
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link href="/mqtt-log" className="block text-white hover:text-brand-orange transition-colors duration-200">
                        MQTT Log & Status
                      </Link>
                      <div id="mqtt-status-indicator" className="ml-2">
                        <span style={{ color: 'red', fontSize: '12px' }}>●</span>
                      </div>
                    </div>
                    <Link href="/info" className="block text-white hover:text-brand-orange transition-colors duration-200">
                      Info & User Guide
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          )}
          {/* Main content */}
          <div className="flex-1 pl-0 md:pl-56 transition-all duration-300">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
} 