'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Download, Send, ChevronDown, ChevronUp } from 'lucide-react'
import { TicketClosure } from '@/lib/types'
import { formatDateBR, formatQuantity } from '@/lib/utils'
import { buildWhatsAppLink } from '@/lib/whatsapp'

export default function AdminClosures() {
  const [closures, setClosures] = useState<TicketClosure[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/closures')
      .then((r) => r.json())
      .then((d) => { setClosures(d.closures ?? []); setLoading(false) })
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h2 className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Histórico de Fechamentos
        </h2>

        {loading && <p className="text-sm text-gray-400">Carregando...</p>}

        {!loading && closures.length === 0 && (
          <div className="card text-center py-10 text-sm text-gray-400">
            Nenhum fechamento registrado ainda.
          </div>
        )}

        <div className="space-y-3">
          {closures.map((c) => {
            const open = expanded === c.id
            return (
              <div key={c.id} className="card p-0 overflow-hidden">
                {/* Header row */}
                <button
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setExpanded(open ? null : c.id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: 'var(--green)' }}>
                        #{c.ticket_id}
                      </span>
                      <span className="text-sm font-semibold text-gray-800">{c.ticket_name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {c.company} · {c.technician_name} · {formatDateBR(c.created_at)}
                    </p>
                  </div>
                  {open ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                </button>

                {/* Expanded */}
                {open && (
                  <div className="px-4 pb-4 border-t border-gray-100 space-y-4 animate-fade-in-up">

                    {/* Materiais */}
                    {(c.closure_materials ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400 mb-2 mt-3">Materiais</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="pb-1 font-semibold">Material</th>
                                <th className="pb-1 font-semibold">Unidade</th>
                                <th className="pb-1 font-semibold">Qtd</th>
                              </tr>
                            </thead>
                            <tbody>
                              {c.closure_materials!.map((m) => (
                                <tr key={m.id} className="border-t border-gray-50">
                                  <td className="py-1 pr-3">{m.material_name}</td>
                                  <td className="py-1 pr-3 text-gray-500">{m.unit}</td>
                                  <td className="py-1">{formatQuantity(m.quantity)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Serviços */}
                    {(c.closure_services ?? []).length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400 mb-2">Serviços</p>
                        <div className="space-y-1">
                          {c.closure_services!.map((s) => (
                            <div key={s.id} className="text-xs text-gray-700">
                              <span className="font-semibold">{s.service_name}</span>
                              {s.quantity_or_note && <span className="text-gray-400"> · {s.quantity_or_note}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Observações */}
                    {c.notes && (
                      <div>
                        <p className="text-xs font-bold uppercase text-gray-400 mb-1">Observações</p>
                        <p className="text-xs text-gray-600">{c.notes}</p>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 pt-1">
                      {c.pdf_url && (
                        <a href={c.pdf_url} target="_blank" rel="noreferrer"
                           className="btn-primary py-2 text-xs flex-1">
                          <Download size={13} /> PDF
                        </a>
                      )}
                      {c.pdf_url && (
                        <a href={buildWhatsAppLink(c.ticket_id, c.pdf_url)} target="_blank" rel="noreferrer"
                           className="btn-yellow py-2 text-xs flex-1">
                          <Send size={13} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
