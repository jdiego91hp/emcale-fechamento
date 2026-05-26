'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Pencil, Check, X, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { ServiceType } from '@/lib/types'

export default function AdminServices() {
  const [items, setItems]     = useState<ServiceType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')

  const [editId,   setEditId]   = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  // Fix: ?all=1 para admin ver inativos também
  async function load() {
    setLoading(true)
    const res  = await fetch('/api/services?all=1')
    const data = await res.json()
    setItems(data.serviceTypes ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    setError('')
    const res  = await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setItems((prev) => [...prev, data.serviceType].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName('')
    setShowNew(false)
    setSaving(false)
  }

  async function handleUpdate(id: string, updates: Partial<ServiceType>) {
    setSaving(true)
    setError('')
    const res  = await fetch('/api/services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setItems((prev) => prev.map((s) => (s.id === id ? data.serviceType : s)))
    setEditId(null)
    setSaving(false)
  }

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-syne)' }}>
            Tipos de Serviço
          </h2>
          <button className="btn-primary py-2 px-4 text-xs" onClick={() => setShowNew(!showNew)}>
            <Plus size={15} /> Novo Serviço
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {showNew && (
          <div className="card border-2 animate-fade-in-up" style={{ borderColor: 'var(--green)' }}>
            <p className="text-sm font-bold text-gray-800 mb-3">Novo Serviço</p>
            <label className="label">Nome</label>
            <input
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Ex: Fusão de Fibra"
            />
            <div className="flex gap-2 mt-3">
              <button className="btn-primary py-2 text-xs flex-1" onClick={handleCreate} disabled={saving || !newName.trim()}>
                {saving ? <Loader2 size={14} className="animate-spin-slow" /> : <Check size={14} />} Salvar
              </button>
              <button className="btn-secondary py-2 text-xs flex-1" onClick={() => { setShowNew(false); setNewName('') }}>
                <X size={14} /> Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {items.length} {items.length === 1 ? 'serviço' : 'serviços'}
            </p>
            <p className="text-xs text-gray-400">{items.filter(s => s.active).length} ativos</p>
          </div>

          {loading && <p className="p-5 text-sm text-gray-400">Carregando...</p>}
          {!loading && items.length === 0 && <p className="p-5 text-sm text-gray-400">Nenhum serviço cadastrado.</p>}

          {!loading && items.map((s, i) => (
            <div
              key={s.id}
              className={`px-4 py-3 flex items-center gap-3 ${i > 0 ? 'border-t border-gray-100' : ''} ${!s.active ? 'opacity-50' : ''}`}
            >
              {editId === s.id ? (
                <>
                  <input
                    className="input flex-1 py-1.5 text-xs"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(s.id, { name: editName })}
                  />
                  <button
                    className="p-1.5 rounded-lg text-white" style={{ background: 'var(--green)' }}
                    onClick={() => handleUpdate(s.id, { name: editName })} disabled={saving}
                  >
                    <Check size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500" onClick={() => setEditId(null)}>
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <p className="flex-1 text-sm font-semibold text-gray-800">{s.name}</p>
                  <button
                    className={`p-1 transition-colors ${s.active ? 'text-green-600' : 'text-gray-300'}`}
                    title={s.active ? 'Clique para inativar' : 'Clique para ativar'}
                    onClick={() => handleUpdate(s.id, { active: !s.active })} disabled={saving}
                  >
                    {s.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button
                    className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                    onClick={() => { setEditId(s.id); setEditName(s.name) }}
                  >
                    <Pencil size={15} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}
