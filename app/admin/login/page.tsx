'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Lock, Mail, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import Image from 'next/image'

export default function AdminLogin() {
  const router   = useRouter()
  const supabase = createClient()
  const [email,   setEmail]   = useState('')
  const [password,setPassword]= useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-mail ou senha incorretos.'); setLoading(false); return }
    router.refresh()
    router.push('/admin')
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--gray-50)' }}>

      {/* Topo */}
      <div className="surface-brand relative overflow-hidden flex-shrink-0" style={{ minHeight: 280 }}>
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-10"
             style={{ background: 'var(--yellow)' }} />
        <div className="absolute top-16 -left-10 w-40 h-40 rounded-full opacity-08"
             style={{ background: 'white' }} />
        <div className="absolute bottom-6 right-24 w-16 h-16 rounded-full opacity-10"
             style={{ background: 'var(--red)' }} />

        <div className="relative h-full flex flex-col items-center justify-center gap-5 px-6 py-12">
          <div className="relative w-24 h-24 rounded-3xl overflow-hidden"
               style={{
                 background: 'rgba(255,255,255,.15)',
                 boxShadow: '0 8px 32px rgba(0,0,0,.25), 0 0 0 1px rgba(255,255,255,.1)',
               }}>
            <span className="absolute inset-0 flex items-center justify-center text-white font-black text-4xl z-10">E</span>
            <Image src="/logo-emcale.png" alt="Emcale" fill
                   className="object-contain z-20 relative"
                   onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div className="text-center">
            <h1 className="text-white text-2xl font-extrabold"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-.02em' }}>
              Emcale
            </h1>
            <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,.5)' }}>
              Serviços em Redes Ópticas
            </p>
          </div>
        </div>

        {/* Faixa amarela */}
        <div className="h-1 absolute bottom-0 left-0 right-0" style={{ background: 'var(--yellow)' }} />
      </div>

      {/* Card de login */}
      <div className="flex-1 flex flex-col px-5 -mt-8 relative z-10 pb-8">
        <div className="bg-white rounded-3xl p-6 flex-shrink-0"
             style={{ boxShadow: '0 -4px 40px rgba(0,0,0,.10), var(--shadow-lg)' }}>

          <h2 className="text-xl font-extrabold mb-1"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-900)', letterSpacing: '-.01em' }}>
            Área Administrativa
          </h2>
          <p className="text-sm mb-5" style={{ color: 'var(--gray-400)' }}>
            Acesso restrito a administradores
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="input-group">
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--gray-400)' }} />
                <input className="input pl-11" type="email" placeholder="admin@emcale.com.br"
                       value={email} onChange={e => setEmail(e.target.value)}
                       required autoComplete="email" />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Senha</label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2"
                      style={{ color: 'var(--gray-400)' }} />
                <input className="input pl-11 pr-12"
                       type={showPwd ? 'text' : 'password'}
                       placeholder="••••••••"
                       value={password} onChange={e => setPassword(e.target.value)}
                       required autoComplete="current-password" />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 btn-icon"
                        style={{ color: 'var(--gray-400)' }} onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="alert-error anim-fade-in">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full text-base"
                    style={{ minHeight: 58, borderRadius: 'var(--radius-xl)' }}
                    disabled={loading}>
              {loading
                ? <><Loader2 size={20} className="spin" /> Entrando...</>
                : <><Lock size={20} /> Entrar no Sistema</>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--gray-400)' }}>
          Sistema de Fechamento Técnico · Emcale
        </p>
      </div>
    </div>
  )
}
