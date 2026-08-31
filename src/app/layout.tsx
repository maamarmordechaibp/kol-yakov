import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { Car, PhoneCall, Users, Calendar, Settings, Volume2 } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'קול יעקב - Admin Dashboard',
  description: 'Ride Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full bg-gray-50">
      <body className={`${inter.className} h-full`}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 bg-slate-900 text-white flex flex-col">
            <div className="p-6 text-2xl font-bold bg-slate-950 text-center">
              קול יעקב
            </div>

            <nav className="flex-1 p-4 space-y-2 text-sm font-medium">
              <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded transition hover:bg-slate-800">
                <Car size={18} /> Active Rides
              </Link>
              <Link href="/riders" className="flex items-center gap-3 px-3 py-2 rounded transition hover:bg-slate-800">
                <Users size={18} /> Users & Staff
              </Link>
              <Link href="/schedules" className="flex items-center gap-3 px-3 py-2 rounded transition hover:bg-slate-800">
                <Calendar size={18} /> Schedules & Presets
              </Link>
              <Link href="/calls" className="flex items-center gap-3 px-3 py-2 rounded transition hover:bg-slate-800">
                <PhoneCall size={18} /> Call Logs
              </Link>
              <Link href="/prompts" className="flex items-center gap-3 px-3 py-2 rounded transition hover:bg-slate-800">
                <Volume2 size={18} /> Voice Prompts
              </Link>
            </nav>
          </div>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
