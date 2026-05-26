'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Plus, Pencil, Check, X, Loader2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Material } from '@/lib/types'

const UNITS = ['metro', 'unidade', 'pacote', 'caixa', 'rolo', 'peça']

export default function AdminMaterials() {
  const [items, setItems]     = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newUnit, setNewUnit] = useState('unidade')

  const [editId,   setEditId]   = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editUnit, setEditUnit] = useState('')

  // Fix 14: apenas um fetch, com ?all=1 para ver inativos também
  async function load() {
    setLoading(true)
    const res  = await fetch('/api/materials?all=1')
    const data = await res.json()
    setItems(data.materials ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!newName.trim()) return
    setSaving(true)
    setError('')
    const res  = await fetch('/api/materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), unit: newUnit }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setItems((prev) => [...prev, data.material].sort((a, b) => a.name.localeCompare(b.name)))
    setNewName('')
    setNewUnit('unidade')
    setShowNew(false)
    setSaving(false)
  }

  async function handleUpdate(id: string, updates: Partial<Material>) {
    setSaving(true)
    setError('')
    const res  = await fetch('/api/materials', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setItems((prev) => prev.map((m) => (m.id === id ? data.material : m)))
    setEditId(null)
    setSaving(false)
  }

  function startEdit(m: Material) {
    setEditId(m.id)
    setEditName(m.name)
    setEditUnit(m.unit)
  }

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-syne)' }}>
            Materiais
          </h2>
          <button className="btn-primary py-2 px-4 text-xs" onClick={() => setShowNew(!showNew)}>
            <Plus size={15} /> Novo Material
          </button>
        </div>

        {error && <div className="alert-error">{error}</div>}

        {showNew && (
          <div className="card border-2 animate-fade-in-up" style={{ borderColor: 'var(--green)' }}>
            <p className="text-sm font-bold text-gray-800 mb-3">Novo Material</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nome</label>
                <input
                  className="input"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  placeholder="Ex: Cabo Drop"
                />
              </div>
              <div>
                <label className="label">Unidade</label>
                <select className="input" value={newUnit} onChange={(e) => setNewUnit(e.target.value)}>
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
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
              {items.length} {items.length === 1 ? 'material' : 'materiais'}
            </p>
            <p className="text-xs text-gray-400">
              {items.filter(m => m.active).length} ativos
            </p>
          </div>

          {loading && <p className="p-5 text-sm text-gray-400">Carregando...</p>}
          {!loading && items.length === 0 && <p className="p-5 text-sm text-gray-400">Nenhum material cadastrado.</p>}

          {!loading && items.map((m, i) => (
            <div
              key={m.id}
              className={`px-4 py-3 flex items-center gap-3 ${i > 0 ? 'border-t border-gray-100' : ''} ${!m.active ? 'opacity-50' : ''}`}
            >
              {editId === m.id ? (
                <>
                  <input
                    className="input flex-1 py-1.5 text-xs"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate(m.id, { name: editName, unit: editUnit })}
                  />
                  <select className="input w-28 py-1.5 text-xs" value={editUnit} onChange={(e) => setEditUnit(e.target.value)}>
                    {UNITS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                  <button
                    className="p-1.5 rounded-lg text-white text-xs"
                    style={{ background: 'var(--green)' }}
                    onClick={() => handleUpdate(m.id, { name: editName, unit: editUnit })}
                    disabled={saving}
                  >
                    <Check size={14} />
                  </button>
                  <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500" onClick={() => setEditId(null)}>
                    <X size={14} />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.unit}</p>
                  </div>
                  <button
                    className={`p-1 transition-colors ${m.active ? 'text-green-600' : 'text-gray-300'}`}
                    title={m.active ? 'Clique para inativar' : 'Clique para ativar'}
                    onClick={() => handleUpdate(m.id, { active: !m.active })}
                    disabled={saving}
                  >
                    {m.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                  </button>
                  <button
                    className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors"
                    onClick={() => startEdit(m)}
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
