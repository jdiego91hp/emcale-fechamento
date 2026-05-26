'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import {
  Search, Plus, Trash2, CheckCircle, Send, Download,
  AlertCircle, Loader2, X, Package, Wrench, User,
  FileText, ChevronRight, ArrowLeft, ClipboardList,
  MessageCircle, Sparkles
} from 'lucide-react'
import { TicketData, Material, ServiceType, ClosureMaterialInput, ClosureServiceInput } from '@/lib/types'
import { buildWhatsAppLink } from '@/lib/whatsapp'

interface MaterialRow extends ClosureMaterialInput { _key: string }
interface ServiceRow  extends ClosureServiceInput  { _key: string }

type Step = 'search' | 'form' | 'done'

// ── Step Indicator ────────────────────────────────────────
function StepBar({ step }: { step: Step }) {
  const steps = [
    { key: 'search', label: 'Ticket' },
    { key: 'form',   label: 'Detalhes' },
    { key: 'done',   label: 'Concluído' },
  ]
  const idx = steps.findIndex(s => s.key === step)

  return (
    <div className="flex items-center gap-0 px-6 py-4">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div className="flex flex-col items-center gap-1">
            <div className={`step-dot text-xs ${
              i < idx  ? 'step-dot-done' :
              i === idx ? 'step-dot-active anim-bounce-in' :
              'step-dot-inactive'
            }`}>
              {i < idx ? <CheckCircle size={14} /> : i + 1}
            </div>
            <span className={`text-xs font-semibold ${
              i <= idx ? 'text-green-700' : 'text-gray-400'
            }`} style={{ color: i <= idx ? 'var(--green-dark)' : 'var(--gray-400)' }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-line mx-1 mb-5 ${
              i < idx ? 'step-line-done' :
              i === idx ? 'step-line-active' :
              'step-line-inactive'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Item de material/serviço ──────────────────────────────
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
      <button className="btn-icon btn-danger w-8 h-8" onClick={onRemove} type="button">
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────
export default function TechnicianPage() {
  const [step, setStep] = useState<Step>('search')

  // Ticket
  const [ticketInput, setTicketInput] = useState('')
  const [ticket, setTicket]           = useState<TicketData | null>(null)
  const [searching, setSearching]     = useState(false)
  const [searchError, setSearchError] = useState('')

  // Form
  const [techName, setTechName] = useState('')
  const [notes, setNotes]       = useState('')
  const [materials, setMaterials] = useState<MaterialRow[]>([])
  const [services, setServices]   = useState<ServiceRow[]>([])
  const [allMaterials, setAllMaterials]     = useState<Material[]>([])
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceType[]>([])

  // Add rows
  const [showAddMat, setShowAddMat]   = useState(false)
  const [showAddSvc, setShowAddSvc]   = useState(false)
  const [newMatId, setNewMatId]       = useState('')
  const [newMatQty, setNewMatQty]     = useState('')
  const [newSvcId, setNewSvcId]       = useState('')
  const [newSvcNote, setNewSvcNote]   = useState('')

  // Submit
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [pdfUrl, setPdfUrl]           = useState('')

  // ── Buscar ticket ──────────────────────────────────────
  async function handleSearch() {
    if (!ticketInput.trim()) return
    setSearching(true)
    setSearchError('')
    setTicket(null)
    try {
      const res  = await fetch(`/api/tickets?id=${encodeURIComponent(ticketInput.trim())}`)
      const data = await res.json()
      if (!res.ok || !data.ticket) {
        setSearchError(data.error ?? 'Ticket não encontrado.')
      } else {
        setTicket(data.ticket)
        await loadCatalog()
        setStep('form')
      }
    } catch {
      setSearchError('Erro de conexão. Tente novamente.')
    } finally {
      setSearching(false)
    }
  }

  async function loadCatalog() {
    const [matRes, svcRes] = await Promise.all([
      fetch('/api/materials'),
      fetch('/api/services'),
    ])
    const matData = await matRes.json()
    const svcData = await svcRes.json()
    setAllMaterials(matData.materials ?? [])
    setAllServiceTypes(svcData.serviceTypes ?? [])
  }

  function addMaterial() {
    const mat = allMaterials.find(m => m.id === newMatId)
    if (!mat || !newMatQty) return
    setMaterials(p => [...p, {
      _key: Math.random().toString(36).slice(2),
      material_id: mat.id, material_name: mat.name, unit: mat.unit,
      quantity: parseFloat(newMatQty.replace(',', '.')),
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

  async function handleSubmit() {
    if (!ticket) return
    if (!techName.trim())              { setSubmitError('Informe o nome do técnico.'); return }
    if (!materials.length && !services.length) { setSubmitError('Adicione pelo menos um material ou serviço.'); return }
    setSubmitting(true); setSubmitError('')
    try {
      const res  = await fetch('/api/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.ticket_id, ticket_name: ticket.ticket_name,
          company: ticket.company, technician_name: techName.trim(),
          notes: notes.trim(),
          materials: materials.map(({ _key, ...m }) => m),
          services:  services.map(({ _key, ...s }) => s),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao finalizar.')
      setPdfUrl(data.pdf_url)
      setStep('done')
    } catch (e: any) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setStep('search'); setTicket(null); setTicketInput('');
    setTechName(''); setNotes(''); setMaterials([]); setServices([]);
    setPdfUrl(''); setSubmitError(''); setSearchError('');
  }

  // ── RENDER ────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--gray-50)' }}>

      {/* ── Header ───────────────────────────────────────── */}
      <header className="surface-green relative overflow-hidden">
        {/* Círculos decorativos */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10"
             style={{ background: 'var(--yellow)' }} />
        <div className="absolute -bottom-6 -left-4 w-24 h-24 rounded-full opacity-10"
             style={{ background: 'white' }} />

        <div className="relative px-5 pt-10 pb-5">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0"
                 style={{ background: 'rgba(255,255,255,.2)' }}>
              <span className="absolute inset-0 flex items-center justify-center text-white font-black text-lg z-10">E</span>
              <Image
                src="/logo-emcale.png" alt="Emcale" fill
                className="object-contain relative z-20"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>

            <div className="flex-1">
              <h1 className="text-white font-extrabold text-xl leading-tight"
                  style={{ fontFamily: 'var(--font-display)' }}>
                Emcale
              </h1>
              <p className="text-white/70 text-xs font-medium">Fechamento Técnico</p>
            </div>

            {/* Indicador data */}
            <div className="text-right">
              <p className="text-white/60 text-xs">
                {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </p>
              <p className="text-white/40 text-xs">
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Faixa amarela */}
        <div className="h-1" style={{ background: 'var(--yellow)' }} />

        {/* Step bar */}
        <div className="glass">
          <StepBar step={step} />
        </div>
      </header>

      {/* ── Conteúdo ─────────────────────────────────────── */}
      <main className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-4 pb-8">

        {/* ══ STEP: SEARCH ══════════════════════════════ */}
        {step === 'search' && (
          <div className="anim-fade-up space-y-5">

            {/* Hero card */}
            <div className="card-elevated text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4"
                   style={{ background: 'linear-gradient(135deg, var(--green-50), var(--green-100))', boxShadow: 'var(--shadow-green-sm)' }}>
                <ClipboardList size={36} style={{ color: 'var(--green)' }} />
              </div>
              <h2 className="text-2xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-900)' }}>
                Novo Atendimento
              </h2>
              <p className="text-sm" style={{ color: 'var(--gray-400)' }}>
                Informe o ID do ticket para começar
              </p>
            </div>

            {/* Busca */}
            <div className="card-elevated space-y-4">
              <div className="input-group">
                <label className="label">ID do Ticket</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2"
                            style={{ color: 'var(--gray-400)' }} />
                    <input
                      className="input pl-11"
                      placeholder="Ex: TKT-001"
                      value={ticketInput}
                      onChange={e => setTicketInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSearch()}
                      disabled={searching}
                      autoCapitalize="characters"
                      autoCorrect="off"
                    />
                  </div>
                  <button
                    className="btn-primary px-5"
                    onClick={handleSearch}
                    disabled={searching || !ticketInput.trim()}
                    style={{ minWidth: 56 }}
                  >
                    {searching
                      ? <Loader2 size={20} className="spin" />
                      : <Search size={20} />}
                  </button>
                </div>
              </div>

              {searchError && (
                <div className="alert-error anim-fade-in">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{searchError}</span>
                </div>
              )}
            </div>

            {/* Dica */}
            <p className="text-center text-xs" style={{ color: 'var(--gray-400)' }}>
              O ID do ticket está no seu sistema de chamados
            </p>
          </div>
        )}

        {/* ══ STEP: FORM ════════════════════════════════ */}
        {step === 'form' && ticket && (
          <div className="anim-fade-up space-y-4">

            {/* Ticket card */}
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
              <div className="surface-green px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(255,255,255,.2)' }}>
                    <FileText size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white/60 text-xs font-medium uppercase tracking-wide">Ticket</p>
                    <p className="text-white font-extrabold text-base" style={{ fontFamily: 'var(--font-display)' }}>
                      #{ticket.ticket_id}
                    </p>
                  </div>
                </div>
                <button onClick={reset} className="btn-icon" style={{ color: 'rgba(255,255,255,.7)' }}>
                  <X size={18} />
                </button>
              </div>
              <div className="bg-white px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>{ticket.ticket_name}</p>
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{ticket.company}</p>
                </div>
                <span className="badge badge-green">✓ Localizado</span>
              </div>
            </div>

            {/* Técnico */}
            <div className="card-elevated">
              <div className="flex items-center gap-2 mb-3">
                <User size={16} style={{ color: 'var(--green)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>
                  Técnico Responsável
                </h3>
                <span className="text-red-500 text-xs font-bold">*</span>
              </div>
              <input
                className="input"
                placeholder="Seu nome completo"
                value={techName}
                onChange={e => setTechName(e.target.value)}
              />
            </div>

            {/* Materiais */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package size={16} style={{ color: 'var(--green)' }} />
                  <h3 className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>
                    Materiais
                  </h3>
                  {materials.length > 0 && (
                    <span className="badge badge-green">{materials.length}</span>
                  )}
                </div>
                {!showAddMat && (
                  <button
                    className="btn-secondary py-2 px-3 text-xs"
                    style={{ minHeight: 36, borderRadius: 'var(--radius-md)' }}
                    onClick={() => setShowAddMat(true)}
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                )}
              </div>

              {/* Lista de materiais */}
              {materials.length > 0 && (
                <div className="space-y-2 mb-3">
                  {materials.map(m => (
                    <ListItem
                      key={m._key}
                      label={m.material_name}
                      sub={`${m.quantity} ${m.unit}`}
                      onRemove={() => setMaterials(p => p.filter(x => x._key !== m._key))}
                    />
                  ))}
                </div>
              )}

              {/* Formulário adicionar material */}
              {showAddMat && (
                <div className="rounded-2xl p-4 space-y-3 anim-slide-down"
                     style={{ background: 'var(--green-50)', border: '1.5px solid var(--green-100)' }}>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--green-dark)' }}>
                    Novo Material
                  </p>
                  <div className="space-y-2">
                    <div className="input-group">
                      <label className="label">Material</label>
                      <select className="input" value={newMatId} onChange={e => setNewMatId(e.target.value)}>
                        <option value="">Selecione o material...</option>
                        {allMaterials.map(m => (
                          <option key={m.id} value={m.id}>{m.name} · {m.unit}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="label">Quantidade</label>
                      <input
                        className="input"
                        placeholder="Ex: 80 ou 1,5"
                        value={newMatQty}
                        onChange={e => setNewMatQty(e.target.value)}
                        inputMode="decimal"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1 py-3 text-sm"
                            style={{ minHeight: 44 }}
                            onClick={addMaterial} disabled={!newMatId || !newMatQty}>
                      <Plus size={16} /> Confirmar
                    </button>
                    <button className="btn-ghost py-3 text-sm"
                            style={{ minHeight: 44 }}
                            onClick={() => { setShowAddMat(false); setNewMatId(''); setNewMatQty('') }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {materials.length === 0 && !showAddMat && (
                <p className="text-xs text-center py-2" style={{ color: 'var(--gray-400)' }}>
                  Nenhum material adicionado
                </p>
              )}
            </div>

            {/* Serviços */}
            <div className="card-elevated">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wrench size={16} style={{ color: 'var(--green)' }} />
                  <h3 className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>
                    Serviços
                  </h3>
                  {services.length > 0 && (
                    <span className="badge badge-green">{services.length}</span>
                  )}
                </div>
                {!showAddSvc && (
                  <button
                    className="btn-secondary py-2 px-3 text-xs"
                    style={{ minHeight: 36, borderRadius: 'var(--radius-md)' }}
                    onClick={() => setShowAddSvc(true)}
                  >
                    <Plus size={14} /> Adicionar
                  </button>
                )}
              </div>

              {services.length > 0 && (
                <div className="space-y-2 mb-3">
                  {services.map(s => (
                    <ListItem
                      key={s._key}
                      label={s.service_name}
                      sub={s.quantity_or_note || undefined}
                      onRemove={() => setServices(p => p.filter(x => x._key !== s._key))}
                    />
                  ))}
                </div>
              )}

              {showAddSvc && (
                <div className="rounded-2xl p-4 space-y-3 anim-slide-down"
                     style={{ background: 'var(--green-50)', border: '1.5px solid var(--green-100)' }}>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--green-dark)' }}>
                    Novo Serviço
                  </p>
                  <div className="space-y-2">
                    <div className="input-group">
                      <label className="label">Tipo de Serviço</label>
                      <select className="input" value={newSvcId} onChange={e => setNewSvcId(e.target.value)}>
                        <option value="">Selecione o serviço...</option>
                        {allServiceTypes.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="label">Qtd / Observação (opcional)</label>
                      <input
                        className="input"
                        placeholder="Ex: 100m, 4 fusões..."
                        value={newSvcNote}
                        onChange={e => setNewSvcNote(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1 py-3 text-sm"
                            style={{ minHeight: 44 }}
                            onClick={addService} disabled={!newSvcId}>
                      <Plus size={16} /> Confirmar
                    </button>
                    <button className="btn-ghost py-3 text-sm"
                            style={{ minHeight: 44 }}
                            onClick={() => { setShowAddSvc(false); setNewSvcId(''); setNewSvcNote('') }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {services.length === 0 && !showAddSvc && (
                <p className="text-xs text-center py-2" style={{ color: 'var(--gray-400)' }}>
                  Nenhum serviço adicionado
                </p>
              )}
            </div>

            {/* Observações */}
            <div className="card-elevated">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={16} style={{ color: 'var(--green)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>
                  Observações
                </h3>
                <span className="badge badge-gray text-xs">opcional</span>
              </div>
              <textarea
                className="input"
                rows={3}
                placeholder="Descreva detalhes importantes do atendimento..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{ minHeight: 90 }}
              />
            </div>

            {submitError && (
              <div className="alert-error anim-fade-in">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Botão finalizar */}
            <button
              className="btn-primary w-full text-base"
              style={{ minHeight: 60, borderRadius: 'var(--radius-xl)', fontSize: '1rem', animation: 'pulse-green 2s infinite' }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <><Loader2 size={22} className="spin" /> Finalizando chamado...</>
                : <><CheckCircle size={22} /> Finalizar Chamado</>}
            </button>
          </div>
        )}

        {/* ══ STEP: DONE ════════════════════════════════ */}
        {step === 'done' && (
          <div className="anim-scale-in space-y-5 text-center">

            {/* Ícone de sucesso */}
            <div className="py-6">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full mb-4"
                   style={{
                     background: 'linear-gradient(135deg, var(--green-50), var(--green-100))',
                     boxShadow: '0 0 0 8px var(--green-50)',
                   }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center anim-bounce-in"
                     style={{ background: 'var(--green)', boxShadow: 'var(--shadow-green)' }}>
                  <CheckCircle size={44} className="text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-900)' }}>
                Chamado Finalizado!
              </h2>
              <p className="text-sm mt-1" style={{ color: 'var(--gray-400)' }}>
                Relatório gerado e salvo com sucesso
              </p>
            </div>

            {/* Resumo */}
            <div className="card-elevated text-left">
              <div className="flex items-center gap-3 pb-3 mb-3 border-b" style={{ borderColor: 'var(--gray-100)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ background: 'var(--green-50)' }}>
                  <FileText size={18} style={{ color: 'var(--green)' }} />
                </div>
                <div>
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>Ticket finalizado</p>
                  <p className="font-extrabold" style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-900)' }}>
                    #{ticket?.ticket_id}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--gray-700)' }}>{ticket?.ticket_name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>{ticket?.company}</p>

              <div className="flex gap-4 mt-3 pt-3 border-t" style={{ borderColor: 'var(--gray-100)' }}>
                <div className="text-center flex-1">
                  <p className="text-lg font-extrabold" style={{ color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                    {materials.length}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>materiais</p>
                </div>
                <div className="w-px" style={{ background: 'var(--gray-100)' }} />
                <div className="text-center flex-1">
                  <p className="text-lg font-extrabold" style={{ color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                    {services.length}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>serviços</p>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-3">
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noreferrer"
                   className="btn-primary w-full text-base"
                   style={{ minHeight: 58, borderRadius: 'var(--radius-xl)', textDecoration: 'none' }}>
                  <Download size={22} /> Baixar Relatório PDF
                </a>
              )}
              {pdfUrl && ticket && (
                <a href={buildWhatsAppLink(ticket.ticket_id, pdfUrl)} target="_blank" rel="noreferrer"
                   className="btn-yellow w-full text-base"
                   style={{ minHeight: 58, borderRadius: 'var(--radius-xl)', textDecoration: 'none' }}>
                  <Send size={22} /> Enviar pelo WhatsApp
                </a>
              )}
              <button
                className="btn-ghost w-full text-sm"
                style={{ minHeight: 50, borderRadius: 'var(--radius-xl)' }}
                onClick={reset}
              >
                <Sparkles size={18} /> Novo Atendimento
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
