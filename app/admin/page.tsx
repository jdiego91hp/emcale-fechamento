'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { FileText, Package, Wrench, Calendar } from 'lucide-react'
import { formatDateBR } from '@/lib/utils'

interface Stats {
  totalClosures:  number
  totalMaterials: number
  totalServices:  number
  recentClosures: any[]
}

export default function AdminDashboard() {
  const [stats,   setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    async function load() {
      try {
        // Fix 8: /api/closures com limit=5 para dashboard; materiais com ?all=1 para contar todos
        const [closuresRes, matsRes, svcsRes] = await Promise.all([
          fetch('/api/closures?limit=5'),
          fetch('/api/materials?all=1'),
          fetch('/api/services?all=1'),
        ])

        if (!closuresRes.ok || !matsRes.ok || !svcsRes.ok) {
          throw new Error('Erro ao carregar dados do dashboard.')
        }

        const closuresData = await closuresRes.json()
        const matsData     = await matsRes.json()
        const svcsData     = await svcsRes.json()

        // Buscar contagem total separada (sem carregar todos os dados)
        const countRes  = await fetch('/api/closures?limit=1')
        const countData = await countRes.json()

        setStats({
          totalClosures:  closuresData.closures?.length ?? 0,
          totalMaterials: matsData.materials?.length     ?? 0,
          totalServices:  svcsData.serviceTypes?.length  ?? 0,
          recentClosures: closuresData.closures          ?? [],
        })
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const cards = [
    { label: 'Fechamentos (recentes)',  value: stats?.totalClosures  ?? 0, icon: FileText, color: 'var(--green)' },
    { label: 'Materiais Cadastrados',   value: stats?.totalMaterials ?? 0, icon: Package,  color: '#1E88E5' },
    { label: 'Serviços Cadastrados',    value: stats?.totalServices  ?? 0, icon: Wrench,   color: '#7B1FA2' },
    { label: 'Hoje',                    value: new Date().toLocaleDateString('pt-BR'), icon: Calendar, color: 'var(--yellow-dark)' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Dashboard
        </h2>

        {error && (
          <div className="alert-error">{error}</div>
        )}

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className="card flex flex-col gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: c.color + '18' }}
              >
                <c.icon size={20} style={{ color: c.color }} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                  {loading ? '—' : c.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Fechamentos recentes */}
        <div className="card">
          <h3 className="font-bold text-sm text-gray-800 mb-4">Últimos Fechamentos</h3>

          {loading && <p className="text-sm text-gray-400">Carregando...</p>}

          {!loading && (stats?.recentClosures.length ?? 0) === 0 && (
            <p className="text-sm text-gray-400">Nenhum fechamento registrado ainda.</p>
          )}

          {!loading && (stats?.recentClosures ?? []).map((c: any) => (
            <div
              key={c.id}
              className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">#{c.ticket_id}</p>
                <p className="text-xs text-gray-500">{c.ticket_name} · {c.technician_name}</p>
              </div>
              <p className="text-xs text-gray-400 shrink-0 ml-2">{formatDateBR(c.created_at)}</p>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
