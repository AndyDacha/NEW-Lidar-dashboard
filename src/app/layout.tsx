"use client";
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from './Sidebar';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 pl-0 md:pl-56 transition-all duration-300">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
} 