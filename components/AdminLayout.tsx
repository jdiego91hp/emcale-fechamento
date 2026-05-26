'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabaseClient'
import {
  LayoutDashboard, Package, Wrench, FileText,
  BarChart2, LogOut, Menu, X, ChevronRight, Bell
} from 'lucide-react'

const NAV = [
  { href: '/admin',           label: 'Dashboard',   icon: LayoutDashboard, color: '#009C3B' },
  { href: '/admin/materials', label: 'Materiais',   icon: Package,         color: '#1E88E5' },
  { href: '/admin/services',  label: 'Serviços',    icon: Wrench,          color: '#8E24AA' },
  { href: '/admin/closures',  label: 'Fechamentos', icon: FileText,        color: '#F4511E' },
  { href: '/admin/reports',   label: 'Relatórios',  icon: BarChart2,       color: '#00897B' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [checking, setChecking] = useState(true)
  const [open, setOpen]         = useState(false)

  useEffect(() => {
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
      <div className="min-h-dvh flex items-center justify-center surface-green">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-white/30 border-t-white"
               style={{ animation: 'spin .9s linear infinite' }} />
          <p className="text-white/60 text-sm">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  const currentNav = NAV.find(n =>
    n.href === '/admin' ? pathname === '/admin' : pathname.startsWith(n.href)
  )

  return (
    <div className="min-h-dvh flex" style={{ background: 'var(--gray-50)' }}>

      {/* ── Sidebar ────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 flex flex-col
        transition-transform duration-300 ease-out lg:translate-x-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `} style={{ background: 'var(--green-darker)', borderRight: '1px solid rgba(255,255,255,.08)' }}>

        {/* Logo */}
        <div className="px-5 py-6 flex items-center gap-3"
             style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
          <div className="relative w-11 h-11 rounded-2xl flex-shrink-0 overflow-hidden"
               style={{ background: 'rgba(255,255,255,.15)' }}>
            <span className="absolute inset-0 flex items-center justify-center text-white font-black text-lg z-10">E</span>
            <Image src="/logo-emcale.png" alt="Emcale" fill
              className="object-contain z-20 relative"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-extrabold text-base truncate"
               style={{ fontFamily: 'var(--font-display)' }}>Emcale</p>
            <p className="text-white/40 text-xs">Painel Administrativo</p>
          </div>
          <button className="lg:hidden btn-icon" style={{ color: 'rgba(255,255,255,.5)' }}
                  onClick={() => setOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-xs font-bold uppercase tracking-widest px-3 mb-3"
             style={{ color: 'rgba(255,255,255,.25)' }}>Menu</p>
          {NAV.map(({ href, label, icon: Icon, color }) => {
            const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-2xl text-sm font-semibold
                      transition-all duration-200 group
                      ${active ? 'text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}
                    style={active ? {
                      background: 'rgba(255,255,255,.12)',
                      boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                    } : {}}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                     style={{ background: active ? color + '30' : 'rgba(255,255,255,.06)' }}>
                  <Icon size={16} style={{ color: active ? color : 'rgba(255,255,255,.4)' }} />
                </div>
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} style={{ color: 'rgba(255,255,255,.4)' }} />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <button onClick={logout}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-2xl text-sm font-semibold
                             text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                 style={{ background: 'rgba(255,255,255,.06)' }}>
              <LogOut size={16} style={{ color: 'rgba(255,255,255,.4)' }} />
            </div>
            Sair do sistema
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden anim-fade-in"
             onClick={() => setOpen(false)} />
      )}

      {/* ── Conteúdo ──────────────────────────────────── */}
      <div className="flex-1 lg:ml-72 flex flex-col min-h-dvh">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white flex items-center gap-3 px-4 py-3"
                style={{ borderBottom: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)' }}>
          <button className="lg:hidden btn-icon" style={{ color: 'var(--gray-600)' }}
                  onClick={() => setOpen(true)}>
            <Menu size={22} />
          </button>

          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide"
               style={{ color: 'var(--gray-400)' }}>Emcale Admin</p>
            <p className="text-sm font-bold" style={{ color: 'var(--gray-800)' }}>
              {currentNav?.label ?? 'Painel'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                 style={{ background: 'var(--green-50)' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--green)', animation: 'pulse-green 2s infinite' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--green-dark)' }}>Online</span>
            </div>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
