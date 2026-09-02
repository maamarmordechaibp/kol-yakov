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
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-slate-50 text-slate-900`}>
        <div className="flex h-full">
          {/* Glassmorphism Sidebar */}
          <div className="w-72 glass-sidebar flex flex-col transition-all duration-300 z-50 relative">

            {/* Header / Logo Area */}
            <div className="p-8 text-3xl font-extrabold bg-gradient-to-br from-indigo-500 to-purple-600 bg-clip-text text-transparent text-center border-b border-slate-800 tracking-tight">
              קול יעקב
              <div className="text-xs text-slate-400 font-normal tracking-widest uppercase mt-2 glow-text">Admin Command</div>
            </div>

            {/* Navigation Array */}
            <nav className="flex-1 p-6 space-y-3 font-medium text-slate-300">
              <Link href="/" className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-indigo-500/20 hover:text-indigo-300 group">
                <Car size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="tracking-wide">Active Rides</span>
              </Link>

              <Link href="/riders" className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-indigo-500/20 hover:text-indigo-300 group">
                <Users size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="tracking-wide">Users &amp; Staff</span>
              </Link>

              <Link href="/schedules" className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-indigo-500/20 hover:text-indigo-300 group">
                <Calendar size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="tracking-wide">Schedules</span>
              </Link>

              <Link href="/calls" className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-indigo-500/20 hover:text-indigo-300 group">
                <PhoneCall size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="tracking-wide">Call Logs</span>
              </Link>

              <Link href="/prompts" className="flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-indigo-500/20 hover:text-indigo-300 group">
                <Volume2 size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="tracking-wide">Voice Engine</span>
              </Link>
            </nav>

            {/* Bottom Status Indicator */}
            <div className="p-6 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
              <span>System Online</span>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 relative">
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>

            <div className="flex-1 w-full max-w-7xl mx-auto p-8 page-transition">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  )
}
