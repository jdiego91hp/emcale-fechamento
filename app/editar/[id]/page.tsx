'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft, Save, Plus, Trash2, Package, Wrench,
  MessageCircle, User, AlertCircle, Loader2,
  CheckCircle, Download, Send, FileText
} from 'lucide-react'
import { Material, ServiceType, ClosureMaterialInput, ClosureServiceInput, TicketClosure } from '@/lib/types'
import { buildWhatsAppLink } from '@/lib/whatsapp'

interface MaterialRow extends ClosureMaterialInput { _key: string }
interface ServiceRow  extends ClosureServiceInput  { _key: string }

function ListItem({ label, sub, onRemove }: { label: string; sub?: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-4 py-3 anim-slide-down"
         style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-100)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: 'var(--green-50)' }}>
        <CheckCircle size={15} style={{ color: 'var(--green)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--gray-800)' }}>{label}</p>
        {sub && <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{sub}</p>}
      </div>
      <button className="btn-icon btn-outline-red w-8 h-8" onClick={onRemove} type="button">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

export default function EditarFechamento() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()

  const [closure,   setClosure]   = useState<TicketClosure | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [loadError, setLoadError] = useState('')

  const [techName,   setTechName]   = useState('')
  const [notes,      setNotes]      = useState('')
  const [materials,  setMaterials]  = useState<MaterialRow[]>([])
  const [services,   setServices]   = useState<ServiceRow[]>([])

  const [allMaterials,    setAllMaterials]    = useState<Material[]>([])
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceType[]>([])

  const [showAddMat, setShowAddMat] = useState(false)
  const [showAddSvc, setShowAddSvc] = useState(false)
  const [newMatId,   setNewMatId]   = useState('')
  const [newMatQty,  setNewMatQty]  = useState('')
  const [newSvcId,   setNewSvcId]   = useState('')
  const [newSvcNote, setNewSvcNote] = useState('')

  const [saving,     setSaving]     = useState(false)
  const [saveError,  setSaveError]  = useState('')
  const [saved,      setSaved]      = useState(false)
  const [pdfUrl,     setPdfUrl]     = useState('')

  // ── Carregar fechamento e catálogos ───────────────────
  useEffect(() => {
    async function load() {
      try {
        const [closureRes, matRes, svcRes] = await Promise.all([
          fetch(`/api/closures/${id}`),
          fetch('/api/materials'),
          fetch('/api/services'),
        ])

        if (!closureRes.ok) {
          setLoadError('Fechamento não encontrado.')
          setLoading(false)
          return
        }

        const closureData = await closureRes.json()
        const matData     = await matRes.json()
        const svcData     = await svcRes.json()

        const c: TicketClosure = closureData.closure
        setClosure(c)
        setTechName(c.technician_name)
        setNotes(c.notes ?? '')
        setPdfUrl(c.pdf_url ?? '')

        setMaterials((c.closure_materials ?? []).map(m => ({
          _key: m.id,
          material_id:   m.material_id ?? '',
          material_name: m.material_name,
          unit:          m.unit,
          quantity:      m.quantity,
        })))

        setServices((c.closure_services ?? []).map(s => ({
          _key: s.id,
          service_type_id:  s.service_type_id ?? '',
          service_name:     s.service_name,
          quantity_or_note: s.quantity_or_note ?? '',
        })))

        setAllMaterials(matData.materials    ?? [])
        setAllServiceTypes(svcData.serviceTypes ?? [])
      } catch {
        setLoadError('Erro ao carregar os dados. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  function addMaterial() {
    const mat = allMaterials.find(m => m.id === newMatId)
    if (!mat || !newMatQty) return
    setMaterials(p => [...p, {
      _key: Math.random().toString(36).slice(2),
      material_id: mat.id, material_name: mat.name,
      unit: mat.unit, quantity: parseFloat(newMatQty.replace(',', '.')),
    }])
    setNewMatId(''); setNewMatQty(''); setShowAddMat(false)
  }

  function addService() {
    const svc = allServiceTypes.find(s => s.id === newSvcId)
    if (!svc) return
    setServices(p => [...p, {
      _key: Math.random().toString(36).slice(2),
      service_type_id: svc.id, service_name: svc.name,
      quantity_or_note: newSvcNote,
    }])
    setNewSvcId(''); setNewSvcNote(''); setShowAddSvc(false)
  }

  async function handleSave() {
    if (!techName.trim()) { setSaveError('Informe o nome do técnico.'); return }
    setSaving(true); setSaveError('')

    try {
      const res  = await fetch(`/api/closures/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technician_name: techName.trim(),
          notes:    notes.trim(),
          materials: materials.map(({ _key, ...m }) => m),
          services:  services.map(({ _key, ...s }) => s),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPdfUrl(data.pdf_url)
      setSaved(true)
    } catch (e: any) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── LOADING ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center surface-brand">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="spin text-white" />
          <p className="text-white/60 text-sm font-medium">Carregando fechamento...</p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6" style={{ background: 'var(--gray-50)' }}>
        <div className="text-center">
          <div className="alert-error inline-flex mb-4">
            <AlertCircle size={18} /> {loadError}
          </div>
          <button className="btn-green block mx-auto mt-3" onClick={() => router.back()}>
            <ArrowLeft size={18} /> Voltar
          </button>
        </div>
      </div>
    )
  }

  // ── SALVO COM SUCESSO ─────────────────────────────────
  if (saved) {
    return (
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--gray-50)' }}>
        <header className="surface-brand px-5 pt-10 pb-5">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden mb-4"
               style={{ background: 'rgba(255,255,255,.15)' }}>
            <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xl z-10">E</span>
            <Image src="/logo-emcale.png" alt="Emcale" fill className="object-contain z-20 relative"
                   onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
          </div>
          <div className="h-1 -mx-5" style={{ background: 'var(--yellow)' }} />
        </header>

        <main className="flex-1 px-4 py-8 max-w-lg mx-auto w-full text-center space-y-5">
          <div className="anim-scale-in">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
                 style={{ background: 'var(--green-50)', boxShadow: '0 0 0 8px var(--green-50)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center anim-bounce-in"
                   style={{ background: 'var(--green)', boxShadow: 'var(--shadow-green)' }}>
                <CheckCircle size={36} className="text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-900)' }}>
              Fechamento Atualizado!
            </h2>
            <p className="text-sm" style={{ color: 'var(--gray-400)' }}>
              Novo PDF gerado com sucesso
            </p>
          </div>

          <div className="card-elevated text-left">
            <div className="flex items-center gap-3 pb-3 mb-3 border-b" style={{ borderColor: 'var(--gray-100)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                   style={{ background: 'var(--green-50)' }}>
                <FileText size={18} style={{ color: 'var(--green)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--gray-400)' }}>Ticket editado</p>
                <p className="font-extrabold" style={{ fontFamily: 'var(--font-display)' }}>
                  #{closure?.ticket_id}
                </p>
              </div>
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--gray-700)' }}>{closure?.ticket_name}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>{closure?.company}</p>
          </div>

          <div className="space-y-3">
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noreferrer"
                 className="btn-green w-full text-base"
                 style={{ minHeight: 58, borderRadius: 'var(--radius-xl)', textDecoration: 'none' }}>
                <Download size={20} /> Baixar PDF Atualizado
              </a>
            )}
            {pdfUrl && closure && (
              <a href={buildWhatsAppLink(closure.ticket_id, pdfUrl)} target="_blank" rel="noreferrer"
                 className="btn-yellow w-full text-base"
                 style={{ minHeight: 58, borderRadius: 'var(--radius-xl)', textDecoration: 'none' }}>
                <Send size={20} /> Enviar pelo WhatsApp
              </a>
            )}
            <button className="btn-ghost w-full" onClick={() => router.push('/')}>
              <ArrowLeft size={18} /> Fechar Novo Ticket
            </button>
          </div>
        </main>
      </div>
    )
  }

  // ── FORMULÁRIO DE EDIÇÃO ──────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--gray-50)' }}>

      {/* Header */}
      <header className="surface-brand relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-10"
             style={{ background: 'var(--yellow)' }} />
        <div className="relative px-5 pt-10 pb-5">
          <button className="flex items-center gap-2 mb-4 text-white/60 hover:text-white transition-colors"
                  onClick={() => router.back()}>
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Voltar</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0"
                 style={{ background: 'rgba(255,255,255,.15)' }}>
              <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xl z-10">E</span>
              <Image src="/logo-emcale.png" alt="Emcale" fill
                     className="object-contain z-20 relative"
                     onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div>
              <p className="text-white/60 text-xs font-medium uppercase tracking-wide">Editando</p>
              <h1 className="text-white font-extrabold text-xl"
                  style={{ fontFamily: 'var(--font-display)' }}>
                Ticket #{closure?.ticket_id}
              </h1>
            </div>
          </div>
        </div>
        <div className="h-1" style={{ background: 'var(--yellow)' }} />
        {/* Info do ticket */}
        <div style={{ background: 'rgba(0,0,0,.15)' }} className="px-5 py-3">
          <p className="text-white font-semibold text-sm">{closure?.ticket_name}</p>
          <p className="text-white/50 text-xs">{closure?.company}</p>
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-4 pb-8">

        {/* Alerta de edição */}
        <div className="alert-warning anim-fade-in">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>Você está editando um fechamento já enviado. O PDF será regerado automaticamente.</span>
        </div>

        {/* Técnico */}
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-3">
            <User size={16} style={{ color: 'var(--green)' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>Técnico Responsável</h3>
            <span style={{ color: 'var(--red)', fontSize: '.75rem', fontWeight: 700 }}>*</span>
          </div>
          <input className="input" placeholder="Nome do técnico"
                 value={techName} onChange={e => setTechName(e.target.value)} />
        </div>

        {/* Materiais */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Package size={16} style={{ color: 'var(--green)' }} />
              <h3 className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>Materiais</h3>
              {materials.length > 0 && <span className="badge badge-green">{materials.length}</span>}
            </div>
            {!showAddMat && (
              <button className="btn-secondary py-2 px-3 text-xs"
                      style={{ minHeight: 36, borderRadius: 'var(--radius-md)' }}
                      onClick={() => setShowAddMat(true)}>
                <Plus size={14} /> Adicionar
              </button>
            )}
          </div>

          {materials.length > 0 && (
            <div className="space-y-2 mb-3">
              {materials.map(m => (
                <ListItem key={m._key} label={m.material_name}
                          sub={`${m.quantity} ${m.unit}`}
                          onRemove={() => setMaterials(p => p.filter(x => x._key !== m._key))} />
              ))}
            </div>
          )}

          {showAddMat && (
            <div className="rounded-2xl p-4 space-y-3 anim-slide-down"
                 style={{ background: 'var(--green-50)', border: '1.5px solid var(--green-100)' }}>
              <div className="input-group">
                <label className="label">Material</label>
                <select className="input" value={newMatId} onChange={e => setNewMatId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {allMaterials.map(m => <option key={m.id} value={m.id}>{m.name} · {m.unit}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="label">Quantidade</label>
                <input className="input" placeholder="Ex: 80 ou 1,5"
                       value={newMatQty} onChange={e => setNewMatQty(e.target.value)} inputMode="decimal" />
              </div>
              <div className="flex gap-2">
                <button className="btn-green flex-1 py-3 text-sm" style={{ minHeight: 44 }}
                        onClick={addMaterial} disabled={!newMatId || !newMatQty}>
                  <Plus size={16} /> Confirmar
                </button>
                <button className="btn-ghost py-3 text-sm" style={{ minHeight: 44 }}
                        onClick={() => { setShowAddMat(false); setNewMatId(''); setNewMatQty('') }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {materials.length === 0 && !showAddMat && (
            <p className="text-xs text-center py-2" style={{ color: 'var(--gray-400)' }}>
              Nenhum material
            </p>
          )}
        </div>

        {/* Serviços */}
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wrench size={16} style={{ color: 'var(--green)' }} />
              <h3 className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>Serviços</h3>
              {services.length > 0 && <span className="badge badge-green">{services.length}</span>}
            </div>
            {!showAddSvc && (
              <button className="btn-secondary py-2 px-3 text-xs"
                      style={{ minHeight: 36, borderRadius: 'var(--radius-md)' }}
                      onClick={() => setShowAddSvc(true)}>
                <Plus size={14} /> Adicionar
              </button>
            )}
          </div>

          {services.length > 0 && (
            <div className="space-y-2 mb-3">
              {services.map(s => (
                <ListItem key={s._key} label={s.service_name}
                          sub={s.quantity_or_note || undefined}
                          onRemove={() => setServices(p => p.filter(x => x._key !== s._key))} />
              ))}
            </div>
          )}

          {showAddSvc && (
            <div className="rounded-2xl p-4 space-y-3 anim-slide-down"
                 style={{ background: 'var(--green-50)', border: '1.5px solid var(--green-100)' }}>
              <div className="input-group">
                <label className="label">Tipo de Serviço</label>
                <select className="input" value={newSvcId} onChange={e => setNewSvcId(e.target.value)}>
                  <option value="">Selecione...</option>
                  {allServiceTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="label">Qtd / Observação (opcional)</label>
                <input className="input" placeholder="Ex: 4 fusões, 100m..."
                       value={newSvcNote} onChange={e => setNewSvcNote(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button className="btn-green flex-1 py-3 text-sm" style={{ minHeight: 44 }}
                        onClick={addService} disabled={!newSvcId}>
                  <Plus size={16} /> Confirmar
                </button>
                <button className="btn-ghost py-3 text-sm" style={{ minHeight: 44 }}
                        onClick={() => { setShowAddSvc(false); setNewSvcId(''); setNewSvcNote('') }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {services.length === 0 && !showAddSvc && (
            <p className="text-xs text-center py-2" style={{ color: 'var(--gray-400)' }}>Nenhum serviço</p>
          )}
        </div>

        {/* Observações */}
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={16} style={{ color: 'var(--green)' }} />
            <h3 className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>Observações</h3>
            <span className="badge badge-gray text-xs">opcional</span>
          </div>
          <textarea className="input" rows={3}
                    placeholder="Detalhes do atendimento..."
                    value={notes} onChange={e => setNotes(e.target.value)}
                    style={{ minHeight: 90 }} />
        </div>

        {saveError && (
          <div className="alert-error anim-fade-in">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Botão salvar */}
        <button className="btn-primary w-full text-base" onClick={handleSave} disabled={saving}
                style={{ minHeight: 60, borderRadius: 'var(--radius-xl)', fontSize: '1rem' }}>
          {saving
            ? <><Loader2 size={22} className="spin" /> Salvando e gerando PDF...</>
            : <><Save size={22} /> Salvar Alterações</>}
        </button>

      </main>
    </div>
  )
}
