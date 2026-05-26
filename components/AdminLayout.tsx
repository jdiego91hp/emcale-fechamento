'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import {
  LayoutDashboard, Package, Wrench, FileText,
  BarChart2, LogOut, Menu, X, ChevronRight
} from 'lucide-react'

const NAV = [
  { href: '/admin',           label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/admin/materials', label: 'Materiais',   icon: Package },
  { href: '/admin/services',  label: 'Serviços',    icon: Wrench },
  { href: '/admin/closures',  label: 'Fechamentos', icon: FileText },
  { href: '/admin/reports',   label: 'Relatórios',  icon: BarChart2 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [checking, setChecking] = useState(true)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
    // Fix 6 (client-side): getUser() é mais seguro que getSession()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/admin/login')
      else setChecking(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (checking) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--green)' }}>
        <div className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex" style={{ background: 'var(--gray-50)' }}>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-64 flex flex-col shadow-2xl
          transition-transform duration-300 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: 'var(--green-dark)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
            <Image
              src="/logo-emcale.png" alt="Emcale" width={36} height={36}
              className="object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate" style={{ fontFamily: 'var(--font-syne)' }}>Emcale</p>
            <p className="text-white/50 text-xs">Painel Admin</p>
          </div>
          <button className="ml-auto text-white/60 hover:text-white lg:hidden shrink-0" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}
                `}
              >
                <Icon size={17} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut size={17} /> Sair
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-dvh">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-4 px-4 py-3 border-b border-gray-100 bg-white shadow-sm">
          <button
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          <p className="text-sm font-semibold text-gray-700">
            {NAV.find((n) =>
              n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href)
            )?.label ?? 'Painel'}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} />
            <span className="text-xs text-gray-500">Online</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
