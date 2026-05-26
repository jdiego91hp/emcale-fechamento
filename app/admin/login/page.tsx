'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react'
import Image from 'next/image'

export default function AdminLogin() {
  const router   = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    // Fix 5: router.refresh() sincroniza o estado do servidor com o cookie recém-criado
    // Necessário para que o middleware reconheça a sessão imediatamente
    router.refresh()
    router.push('/admin')
  }

  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, var(--green-dark) 0%, var(--green) 100%)' }}
    >
      <div className="w-full max-w-sm">

        {/* Logo + título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 mb-4 backdrop-blur relative overflow-hidden">
            <span className="text-white font-black text-3xl">E</span>
            <Image
              src="/logo-emcale.png"
              alt="Emcale"
              width={56}
              height={56}
              className="object-contain absolute inset-0 w-full h-full"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
          <h1
            className="text-white text-2xl font-extrabold"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Área Administrativa
          </h1>
          <p className="text-white/60 text-sm mt-1">
            Sistema de Fechamento Técnico Emcale
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">

            <div>
              <label className="label">E-mail</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9"
                  type="email"
                  placeholder="admin@emcale.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-9"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="alert-error">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3.5"
              disabled={loading}
            >
              {loading
                ? <><Loader2 size={17} className="animate-spin-slow" /> Entrando...</>
                : <><Lock size={17} /> Entrar</>
              }
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}
