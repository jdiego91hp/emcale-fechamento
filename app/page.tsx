'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  Search, Plus, Trash2, CheckCircle, Send, Download,
  AlertCircle, Loader2, X, Package, Wrench, User,
  FileText, MessageCircle, Pencil, Wifi
} from 'lucide-react'
import { TicketData, Material, ServiceType, ClosureMaterialInput, ClosureServiceInput } from '@/lib/types'
import { buildWhatsAppLink } from '@/lib/whatsapp'

interface MaterialRow extends ClosureMaterialInput { _key: string }
interface ServiceRow  extends ClosureServiceInput  { _key: string }
type Step = 'search' | 'form' | 'done'

// ── Step Bar ──────────────────────────────────────────────
function StepBar({ step }: { step: Step }) {
  const steps = [
    { key: 'search', label: 'Ticket' },
    { key: 'form',   label: 'Detalhes' },
    { key: 'done',   label: 'Concluído' },
  ]
  const idx = steps.findIndex(s => s.key === step)
  return (
    <div className="flex items-center px-6 py-4">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center"
             style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={`step-dot ${
              i < idx  ? 'step-dot-done' :
              i === idx ? 'step-dot-active' :
              'step-dot-inactive'
            }`}>
              {i < idx ? <CheckCircle size={15} /> : i + 1}
            </div>
            <span className="text-xs font-bold"
                  style={{
                    color: i <= idx ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.3)',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '.03em'
                  }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`step-line mx-2 mb-5 ${
              i < idx  ? 'step-line-done' :
              i === idx ? 'step-line-active' :
              'step-line-inactive'
            }`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Item de lista ────────────────────────────────────────
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

// ── Página principal ──────────────────────────────────────
export default function TechnicianPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('search')

  const [ticketInput, setTicketInput] = useState('')
  const [ticket, setTicket]           = useState<TicketData | null>(null)
  const [searching, setSearching]     = useState(false)
  const [searchError, setSearchError] = useState('')

  const [techName, setTechName] = useState('')
  const [notes, setNotes]       = useState('')
  const [materials, setMaterials] = useState<MaterialRow[]>([])
  const [services, setServices]   = useState<ServiceRow[]>([])
  const [allMaterials, setAllMaterials]         = useState<Material[]>([])
  const [allServiceTypes, setAllServiceTypes]   = useState<ServiceType[]>([])

  const [showAddMat, setShowAddMat] = useState(false)
  const [showAddSvc, setShowAddSvc] = useState(false)
  const [newMatId, setNewMatId]     = useState('')
  const [newMatQty, setNewMatQty]   = useState('')
  const [newSvcId, setNewSvcId]     = useState('')
  const [newSvcNote, setNewSvcNote] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [pdfUrl, setPdfUrl]           = useState('')
  const [closureId, setClosureId]     = useState('')

  async function handleSearch() {
    if (!ticketInput.trim()) return
    setSearching(true); setSearchError(''); setTicket(null)
    try {
      const res  = await fetch(`/api/tickets?id=${encodeURIComponent(ticketInput.trim())}`)
      const data = await res.json()
      if (!res.ok || !data.ticket) {
        setSearchError(data.error ?? 'Ticket não encontrado.')
      } else {
        setTicket(data.ticket)
        const [matRes, svcRes] = await Promise.all([fetch('/api/materials'), fetch('/api/services')])
        setAllMaterials((await matRes.json()).materials ?? [])
        setAllServiceTypes((await svcRes.json()).serviceTypes ?? [])
        setStep('form')
      }
    } catch { setSearchError('Erro de conexão. Tente novamente.') }
    finally  { setSearching(false) }
  }

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

  async function handleSubmit() {
    if (!ticket) return
    if (!techName.trim())                      { setSubmitError('Informe o nome do técnico.'); return }
    if (!materials.length && !services.length) { setSubmitError('Adicione ao menos um material ou serviço.'); return }
    setSubmitting(true); setSubmitError('')
    try {
      const res  = await fetch('/api/closures', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.ticket_id, ticket_name: ticket.ticket_name,
          company: ticket.company, technician_name: techName.trim(),
          notes: notes.trim(),
          materials: materials.map(({ _key, ...m }) => m),
          services:  services.map(({ _key, ...s }) => s),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPdfUrl(data.pdf_url)
      setClosureId(data.id)
      setStep('done')
    } catch (e: any) { setSubmitError(e.message) }
    finally { setSubmitting(false) }
  }

  function reset() {
    setStep('search'); setTicket(null); setTicketInput('');
    setTechName(''); setNotes(''); setMaterials([]); setServices([]);
    setPdfUrl(''); setClosureId(''); setSubmitError(''); setSearchError('');
  }

  // ── RENDER ────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--gray-50)' }}>

      {/* ── Header ── */}
      <header className="surface-brand relative overflow-hidden">
        <div className="relative px-5 pt-10 pb-1">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="relative w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0"
                 style={{ background: 'white', boxShadow: '0 4px 16px rgba(0,0,0,.25)' }}>
              <span className="absolute inset-0 flex items-center justify-center font-black text-2xl z-10" style={{ color: 'var(--green)' }}>E</span>
              <Image src="/logo-emcale.png" alt="Emcale" fill
                     className="object-contain z-20 relative"
                     onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </div>
            <div className="flex-1">
              <h1 className="text-white font-extrabold text-xl leading-tight"
                  style={{ fontFamily: 'var(--font-display)', letterSpacing: '-.01em' }}>
                Emcale
              </h1>
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,.55)' }}>
                Serviços em Redes Ópticas
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl"
                 style={{ background: 'rgba(242,194,0,.15)' }}>
              <Wifi size={12} style={{ color: 'var(--yellow)' }} />
              <span className="text-xs font-bold" style={{ color: 'var(--yellow)' }}>Online</span>
            </div>
          </div>
        </div>

        {/* Faixa amarela */}
        <div className="h-0.5 mt-4" style={{ background: 'var(--yellow)' }} />

        {/* Step bar */}
        <StepBar step={step} />
      </header>

      {/* ── Conteúdo ── */}
      <main className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-4 pb-10">

        {/* ══ SEARCH ══ */}
        {step === 'search' && (
          <div className="anim-fade-up space-y-5">

            {/* Hero */}
            <div className="card-elevated text-center py-8 px-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5"
                   style={{
                     background: 'linear-gradient(135deg, var(--green-50), var(--green-100))',
                     boxShadow: '0 8px 24px rgba(13,74,35,.15)'
                   }}>
                <FileText size={36} style={{ color: 'var(--green)' }} />
              </div>
              <h2 className="text-2xl font-extrabold mb-2"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-900)', letterSpacing: '-.02em' }}>
                Fechar Ticket
              </h2>
              <p className="text-sm" style={{ color: 'var(--gray-400)', lineHeight: 1.6 }}>
                Digite o ID do ticket para localizar<br />o chamado e iniciar o fechamento
              </p>
            </div>

            {/* Campo de busca */}
            <div className="card-elevated space-y-4">
              <div className="input-group">
                <label className="label">ID do Ticket</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      className="input"
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
                    className="btn-green flex items-center justify-center"
                    style={{ minWidth: 58, borderRadius: 'var(--radius-lg)' }}
                    onClick={handleSearch}
                    disabled={searching || !ticketInput.trim()}
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

            <p className="text-center text-xs" style={{ color: 'var(--gray-400)' }}>
              O ID está disponível no sistema de chamados
            </p>
          </div>
        )}

        {/* ══ FORM ══ */}
        {step === 'form' && ticket && (
          <div className="anim-fade-up space-y-4">

            {/* Ticket localizado */}
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-md)' }}>
              <div className="surface-brand px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                       style={{ background: 'rgba(255,255,255,.15)' }}>
                    <FileText size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide"
                       style={{ color: 'rgba(255,255,255,.55)' }}>Ticket localizado</p>
                    <p className="text-white font-extrabold text-lg"
                       style={{ fontFamily: 'var(--font-display)', letterSpacing: '-.01em' }}>
                      #{ticket.ticket_id}
                    </p>
                  </div>
                </div>
                <button onClick={reset} className="btn-icon" style={{ color: 'rgba(255,255,255,.6)' }}>
                  <X size={18} />
                </button>
              </div>
              <div className="bg-white px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>{ticket.ticket_name}</p>
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>{ticket.company}</p>
                </div>
                <span className="badge badge-green">✓ Verificado</span>
              </div>
            </div>

            {/* Técnico */}
            <div className="card-elevated">
              <div className="flex items-center gap-2 mb-3">
                <User size={16} style={{ color: 'var(--green)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>Técnico Responsável</h3>
                <span style={{ color: 'var(--red)', fontSize: '.75rem', fontWeight: 700 }}>*</span>
              </div>
              <input className="input" placeholder="Seu nome completo"
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
                      <option value="">Selecione o material...</option>
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
                  Nenhum material adicionado
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
                      <option value="">Selecione o serviço...</option>
                      {allServiceTypes.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label className="label">Qtd / Observação (opcional)</label>
                    <input className="input" placeholder="Ex: 100m, 4 fusões..."
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
                <p className="text-xs text-center py-2" style={{ color: 'var(--gray-400)' }}>
                  Nenhum serviço adicionado
                </p>
              )}
            </div>

            {/* Observações */}
            <div className="card-elevated">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={16} style={{ color: 'var(--green)' }} />
                <h3 className="font-bold text-sm" style={{ color: 'var(--gray-800)' }}>Observações</h3>
                <span className="badge badge-gray">opcional</span>
              </div>
              <textarea className="input" rows={3}
                        placeholder="Descreva detalhes importantes do atendimento..."
                        value={notes} onChange={e => setNotes(e.target.value)}
                        style={{ minHeight: 90 }} />
            </div>

            {submitError && (
              <div className="alert-error anim-fade-in">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Botão finalizar */}
            <button className="btn-primary w-full" onClick={handleSubmit} disabled={submitting}
                    style={{ minHeight: 62, borderRadius: 'var(--radius-xl)', fontSize: '1.0625rem' }}>
              {submitting
                ? <><Loader2 size={22} className="spin" /> Fechando ticket...</>
                : <><CheckCircle size={22} /> Fechar Ticket</>}
            </button>
          </div>
        )}

        {/* ══ DONE ══ */}
        {step === 'done' && (
          <div className="anim-scale-in space-y-5 text-center">

            <div className="py-6">
              <div className="inline-flex items-center justify-center w-28 h-28 rounded-full mb-4"
                   style={{ background: 'var(--green-50)', boxShadow: '0 0 0 10px var(--green-50)' }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center anim-bounce-in"
                     style={{ background: 'var(--green)', boxShadow: 'var(--shadow-green)' }}>
                  <CheckCircle size={44} className="text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-900)', letterSpacing: '-.02em' }}>
                Ticket Fechado!
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
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>Ticket fechado</p>
                  <p className="font-extrabold text-lg"
                     style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-900)', letterSpacing: '-.01em' }}>
                    #{ticket?.ticket_id}
                  </p>
                </div>
              </div>
              <p className="text-sm font-semibold" style={{ color: 'var(--gray-700)' }}>{ticket?.ticket_name}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--gray-400)' }}>{ticket?.company}</p>
              <div className="flex gap-4 mt-3 pt-3 border-t" style={{ borderColor: 'var(--gray-100)' }}>
                <div className="text-center flex-1">
                  <p className="text-xl font-extrabold" style={{ color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                    {materials.length}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--gray-400)' }}>materiais</p>
                </div>
                <div className="w-px" style={{ background: 'var(--gray-100)' }} />
                <div className="text-center flex-1">
                  <p className="text-xl font-extrabold" style={{ color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
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
                   className="btn-green w-full"
                   style={{ minHeight: 58, borderRadius: 'var(--radius-xl)', textDecoration: 'none', fontSize: '1rem' }}>
                  <Download size={20} /> Baixar Relatório PDF
                </a>
              )}
              {pdfUrl && ticket && (
                <a href={buildWhatsAppLink(ticket.ticket_id, pdfUrl)} target="_blank" rel="noreferrer"
                   className="btn-yellow w-full"
                   style={{ minHeight: 58, borderRadius: 'var(--radius-xl)', textDecoration: 'none', fontSize: '1rem' }}>
                  <Send size={20} /> Enviar pelo WhatsApp
                </a>
              )}
              {/* BOTÃO DE EDIÇÃO */}
              {closureId && (
                <button className="btn-outline-red w-full"
                        style={{ minHeight: 52, borderRadius: 'var(--radius-xl)', fontSize: '.9375rem' }}
                        onClick={() => router.push(`/editar/${closureId}`)}>
                  <Pencil size={18} /> Editar este Fechamento
                </button>
              )}
              <button className="btn-ghost w-full" onClick={reset}
                      style={{ minHeight: 48, borderRadius: 'var(--radius-xl)' }}>
                Fechar Novo Ticket
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
