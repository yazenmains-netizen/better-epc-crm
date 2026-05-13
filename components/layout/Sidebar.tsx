'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Receipt,
  Wallet,
  Car,
  CalendarDays,
  MessageSquare,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Jobs', icon: ClipboardList },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/comms', label: 'Communications', icon: MessageSquare },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/expenses', label: 'Expenses', icon: Wallet },
  { href: '/mileage', label: 'Mileage', icon: Car },
]

export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const sidebarContent = (
    <aside className="w-64 flex flex-col bg-[#1F2A33] text-white h-full">
      {/* Logo */}
      <div className="px-6 pt-6 pb-5 border-b border-white/10 flex items-center justify-between">
        <Image
          src="/logo.png"
          alt="Better EPC Rating"
          width={150}
          height={40}
          className="object-contain"
          priority
        />
        {/* Close button — mobile only */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden text-gray-400 hover:text-white p-1 -mr-1"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#16512a] text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs font-medium text-white">Yazen Yafai</p>
          <p className="text-xs text-gray-400">yourhomespecialist.co.uk</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────── */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 flex items-center h-14 px-4 bg-[#1F2A33] border-b border-white/10">
        <button
          onClick={() => setOpen(true)}
          className="text-gray-300 hover:text-white p-1.5 -ml-1.5"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1 flex justify-center">
          <Image src="/logo.png" alt="Better EPC Rating" width={110} height={30} className="object-contain" priority />
        </div>
        {/* spacer to balance the hamburger */}
        <div className="w-8" />
      </div>

      {/* ── Mobile backdrop ────────────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Mobile drawer ──────────────────────────────────── */}
      <div
        className={cn(
          'md:hidden fixed top-0 left-0 z-50 h-full transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>

      {/* ── Desktop sidebar (always visible) ──────────────── */}
      <div className="hidden md:flex min-h-screen shrink-0">
        {sidebarContent}
      </div>
    </>
  )
}
