'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  Search, Plus, Trash2, CheckCircle, Send, Download,
  AlertCircle, Loader2, ChevronRight, X, Package, Wrench
} from 'lucide-react'
import { TicketData, Material, ServiceType, ClosureMaterialInput, ClosureServiceInput } from '@/lib/types'
import { buildWhatsAppLink } from '@/lib/whatsapp'

interface MaterialRow extends ClosureMaterialInput { _key: string }
interface ServiceRow  extends ClosureServiceInput  { _key: string }

export default function TechnicianPage() {
  // ── Step state ────────────────────────────────────────────
  const [step, setStep] = useState<'search' | 'form' | 'done'>('search')

  // ── Ticket search ─────────────────────────────────────────
  const [ticketInput, setTicketInput] = useState('')
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  // ── Form ──────────────────────────────────────────────────
  const [techName, setTechName] = useState('')
  const [notes, setNotes] = useState('')
  const [materials, setMaterials] = useState<MaterialRow[]>([])
  const [services, setServices]   = useState<ServiceRow[]>([])
  const [allMaterials, setAllMaterials]     = useState<Material[]>([])
  const [allServiceTypes, setAllServiceTypes] = useState<ServiceType[]>([])
  const [catalogLoaded, setCatalogLoaded] = useState(false)

  // ── Adding rows ───────────────────────────────────────────
  const [addingMaterial, setAddingMaterial] = useState(false)
  const [addingService, setAddingService]   = useState(false)
  const [newMatId, setNewMatId]     = useState('')
  const [newMatQty, setNewMatQty]   = useState('')
  const [newSvcId, setNewSvcId]     = useState('')
  const [newSvcNote, setNewSvcNote] = useState('')

  // ── Submit ────────────────────────────────────────────────
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [pdfUrl, setPdfUrl]   = useState('')

  // ─────────────────────────────────────────────────────────
  async function handleSearch() {
    if (!ticketInput.trim()) return
    setSearching(true)
    setSearchError('')
    setTicket(null)
    try {
      const res = await fetch(`/api/tickets?id=${encodeURIComponent(ticketInput.trim())}`)
      const data = await res.json()
      if (!res.ok || !data.ticket) {
        setSearchError(data.error ?? 'Ticket não encontrado.')
      } else {
        setTicket(data.ticket)
        if (!catalogLoaded) await loadCatalog()
        setStep('form')
      }
    } catch {
      setSearchError('Erro ao buscar ticket. Tente novamente.')
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
    setCatalogLoaded(true)
  }

  function addMaterialRow() {
    const mat = allMaterials.find((m) => m.id === newMatId)
    if (!mat || !newMatQty) return
    setMaterials((prev) => [
      ...prev,
      {
        _key: Math.random().toString(36).slice(2),
        material_id: mat.id,
        material_name: mat.name,
        unit: mat.unit,
        quantity: parseFloat(newMatQty.replace(',', '.')),
      },
    ])
    setNewMatId('')
    setNewMatQty('')
    setAddingMaterial(false)
  }

  function addServiceRow() {
    const svc = allServiceTypes.find((s) => s.id === newSvcId)
    if (!svc) return
    setServices((prev) => [
      ...prev,
      {
        _key: Math.random().toString(36).slice(2),
        service_type_id: svc.id,
        service_name: svc.name,
        quantity_or_note: newSvcNote,
      },
    ])
    setNewSvcId('')
    setNewSvcNote('')
    setAddingService(false)
  }

  async function handleSubmit() {
    if (!ticket) return
    if (!techName.trim()) { setSubmitError('Informe o nome do técnico.'); return }
    if (materials.length === 0 && services.length === 0) {
      setSubmitError('Adicione pelo menos um material ou serviço.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const payload = {
        ticket_id: ticket.ticket_id,
        ticket_name: ticket.ticket_name,
        company: ticket.company,
        technician_name: techName.trim(),
        notes: notes.trim(),
        materials: materials.map(({ _key, ...m }) => m),
        services: services.map(({ _key, ...s }) => s),
      }
      const res = await fetch('/api/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Erro ao finalizar chamado.')
      setPdfUrl(data.pdf_url)
      setStep('done')
    } catch (e: any) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--gray-50)' }}>

      {/* Header */}
      <header style={{ background: 'var(--green)' }} className="px-4 py-4 flex items-center gap-3 shadow-md">
        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/20 flex items-center justify-center">
          {/* Fix 7: fallback atrás, Image na frente — quando Image falha, span aparece */}
          <span className="text-white font-black text-lg">E</span>
          <Image
            src="/logo-emcale.png"
            alt="Emcale"
            width={40} height={40}
            className="object-contain absolute inset-0 w-full h-full"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Emcale
          </h1>
          <p className="text-white/70 text-xs">Fechamento Técnico</p>
        </div>
      </header>

      {/* Yellow accent */}
      <div style={{ background: 'var(--yellow)', height: 4 }} />

      <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

        {/* ── STEP: SEARCH ── */}
        {step === 'search' && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                   style={{ background: 'var(--green)', boxShadow: '0 8px 24px #009C3B44' }}>
                <Search className="text-white" size={28} />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                Iniciar Atendimento
              </h2>
              <p className="text-gray-500 text-sm mt-1">Informe o ID do ticket para buscar os dados</p>
            </div>

            <div className="card">
              <label className="label">ID do Ticket</label>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  placeholder="Ex: TKT-20240115"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={searching}
                />
                <button
                  className="btn-primary px-4"
                  onClick={handleSearch}
                  disabled={searching || !ticketInput.trim()}
                >
                  {searching
                    ? <Loader2 size={18} className="animate-spin-slow" />
                    : <Search size={18} />}
                </button>
              </div>

              {searchError && (
                <div className="alert-error mt-3">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{searchError}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP: FORM ── */}
        {step === 'form' && ticket && (
          <div className="animate-fade-in-up space-y-5">

            {/* Ticket info */}
            <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              <div className="px-4 py-3 flex items-center justify-between"
                   style={{ background: 'var(--green)' }}>
                <div>
                  <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Ticket encontrado</p>
                  <p className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-display)' }}>
                    #{ticket.ticket_id}
                  </p>
                </div>
                <button
                  className="text-white/70 hover:text-white p-1"
                  onClick={() => { setStep('search'); setTicket(null) }}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="bg-white px-4 py-3 space-y-1">
                <p className="text-sm font-semibold text-gray-800">{ticket.ticket_name}</p>
                <p className="text-xs text-gray-500">{ticket.company}</p>
              </div>
            </div>

            {/* Técnico */}
            <div className="card">
              <label className="label">Nome do Técnico Responsável *</label>
              <input
                className="input"
                placeholder="Seu nome completo"
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
              />
            </div>

            {/* Materiais */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package size={16} style={{ color: 'var(--green)' }} />
                  <h3 className="font-bold text-sm text-gray-800">Materiais Utilizados</h3>
                </div>
                {!addingMaterial && (
                  <button
                    className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
                    style={{ background: 'var(--green)', color: 'white' }}
                    onClick={() => setAddingMaterial(true)}
                  >
                    <Plus size={13} /> Adicionar
                  </button>
                )}
              </div>

              {materials.length > 0 && (
                <div className="space-y-2 mb-3">
                  {materials.map((m) => (
                    <div key={m._key}
                         className="flex items-center justify-between rounded-xl px-3 py-2 text-sm"
                         style={{ background: 'var(--gray-100)' }}>
                      <div>
                        <p className="font-semibold text-gray-800">{m.material_name}</p>
                        <p className="text-xs text-gray-500">{m.quantity} {m.unit}</p>
                      </div>
                      <button
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        onClick={() => setMaterials((prev) => prev.filter((x) => x._key !== m._key))}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {addingMaterial && (
                <div className="rounded-xl border-2 p-3 space-y-2 animate-fade-in-up"
                     style={{ borderColor: 'var(--green)' }}>
                  <div>
                    <label className="label">Material</label>
                    <select className="input" value={newMatId} onChange={(e) => setNewMatId(e.target.value)}>
                      <option value="">Selecione...</option>
                      {allMaterials.map((m) => (
                        <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Quantidade</label>
                    <input
                      className="input"
                      placeholder="Ex: 80 ou 1,5"
                      value={newMatQty}
                      onChange={(e) => setNewMatQty(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button className="btn-primary flex-1 py-2 text-xs" onClick={addMaterialRow}
                            disabled={!newMatId || !newMatQty}>
                      <Plus size={14} /> Confirmar
                    </button>
                    <button className="btn-secondary flex-1 py-2 text-xs" onClick={() => setAddingMaterial(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {materials.length === 0 && !addingMaterial && (
                <p className="text-xs text-gray-400 text-center py-2">Nenhum material adicionado</p>
              )}
            </div>

            {/* Serviços */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wrench size={16} style={{ color: 'var(--green)' }} />
                  <h3 className="font-bold text-sm text-gray-800">Serviços Realizados</h3>
                </div>
                {!addingService && (
                  <button
                    className="flex items-center gap-1 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors"
                    style={{ background: 'var(--green)', color: 'white' }}
                    onClick={() => setAddingService(true)}
                  >
                    <Plus size={13} /> Adicionar
                  </button>
                )}
              </div>

              {services.length > 0 && (
                <div className="space-y-2 mb-3">
                  {services.map((s) => (
                    <div key={s._key}
                         className="flex items-center justify-between rounded-xl px-3 py-2 text-sm"
                         style={{ background: 'var(--gray-100)' }}>
                      <div>
                        <p className="font-semibold text-gray-800">{s.service_name}</p>
                        {s.quantity_or_note && (
                          <p className="text-xs text-gray-500">{s.quantity_or_note}</p>
                        )}
                      </div>
                      <button
                        className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                        onClick={() => setServices((prev) => prev.filter((x) => x._key !== s._key))}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {addingService && (
                <div className="rounded-xl border-2 p-3 space-y-2 animate-fade-in-up"
                     style={{ borderColor: 'var(--green)' }}>
                  <div>
                    <label className="label">Tipo de Serviço</label>
                    <select className="input" value={newSvcId} onChange={(e) => setNewSvcId(e.target.value)}>
                      <option value="">Selecione...</option>
                      {allServiceTypes.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Qtd / Observação (opcional)</label>
                    <input
                      className="input"
                      placeholder="Ex: 100m, 4 fusões..."
                      value={newSvcNote}
                      onChange={(e) => setNewSvcNote(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button className="btn-primary flex-1 py-2 text-xs" onClick={addServiceRow}
                            disabled={!newSvcId}>
                      <Plus size={14} /> Confirmar
                    </button>
                    <button className="btn-secondary flex-1 py-2 text-xs" onClick={() => setAddingService(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {services.length === 0 && !addingService && (
                <p className="text-xs text-gray-400 text-center py-2">Nenhum serviço adicionado</p>
              )}
            </div>

            {/* Observações */}
            <div className="card">
              <label className="label">Observações Gerais</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Observações adicionais sobre o atendimento..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {submitError && (
              <div className="alert-error">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <button
              className="btn-primary w-full py-4 text-base"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <><Loader2 size={18} className="animate-spin-slow" /> Finalizando...</>
                : <><CheckCircle size={18} /> Finalizar Chamado</>}
            </button>
          </div>
        )}

        {/* ── STEP: DONE ── */}
        {step === 'done' && (
          <div className="animate-fade-in-up text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full"
                 style={{ background: 'var(--green)', boxShadow: '0 12px 32px #009C3B55' }}>
              <CheckCircle className="text-white" size={40} />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                Chamado Finalizado!
              </h2>
              <p className="text-gray-500 text-sm mt-2">
                O relatório foi gerado e salvo com sucesso.
              </p>
            </div>

            <div className="card text-left space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ticket</p>
              <p className="font-bold text-gray-900">#{ticket?.ticket_id}</p>
              <p className="text-sm text-gray-600">{ticket?.ticket_name}</p>
            </div>

            <div className="flex flex-col gap-3">
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="btn-primary w-full py-4">
                  <Download size={18} /> Baixar PDF
                </a>
              )}
              {pdfUrl && ticket && (
                <a
                  href={buildWhatsAppLink(ticket.ticket_id, pdfUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-yellow w-full py-4"
                >
                  <Send size={18} /> Enviar pelo WhatsApp
                </a>
              )}
              <button
                className="btn-secondary w-full py-4"
                onClick={() => {
                  setStep('search')
                  setTicket(null)
                  setTicketInput('')
                  setTechName('')
                  setNotes('')
                  setMaterials([])
                  setServices([])
                  setPdfUrl('')
                  setSubmitError('')
                }}
              >
                <ChevronRight size={18} /> Novo Atendimento
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
