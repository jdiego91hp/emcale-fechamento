'use client'

import { useState } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { Search, Download, FileSpreadsheet, Send } from 'lucide-react'
import { TicketClosure } from '@/lib/types'
import { formatDateBR, formatQuantity } from '@/lib/utils'
import { buildWhatsAppLink } from '@/lib/whatsapp'

export default function AdminReports() {
  const [dateFrom,   setDateFrom]   = useState('')
  const [dateTo,     setDateTo]     = useState('')
  const [technician, setTechnician] = useState('')
  const [company,    setCompany]    = useState('')

  const [closures, setClosures] = useState<TicketClosure[]>([])
  const [loading,  setLoading]  = useState(false)
  const [searched, setSearched] = useState(false)

  function buildParams(extra?: Record<string, string>) {
    const p = new URLSearchParams()
    if (dateFrom)   p.set('date_from', dateFrom)
    if (dateTo)     p.set('date_to', dateTo)
    if (technician) p.set('technician', technician)
    if (company)    p.set('company', company)
    if (extra) Object.entries(extra).forEach(([k, v]) => p.set(k, v))
    return p.toString()
  }

  async function handleSearch() {
    setLoading(true)
    setSearched(false)
    const res  = await fetch(`/api/reports?${buildParams()}`)
    const data = await res.json()
    setClosures(data.closures ?? [])
    setLoading(false)
    setSearched(true)
  }

  async function handleExcel() {
    const url = `/api/reports?${buildParams({ format: 'excel' })}`
    const a   = document.createElement('a')
    a.href    = url
    a.download = ''
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <h2 className="text-xl font-extrabold text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
          Relatórios
        </h2>

        {/* Filtros */}
        <div className="card">
          <p className="text-sm font-bold text-gray-700 mb-4">Filtros</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="label">Data Inicial</label>
              <input type="date" className="input text-xs" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">Data Final</label>
              <input type="date" className="input text-xs" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <label className="label">Técnico</label>
              <input className="input text-xs" placeholder="Nome do técnico" value={technician} onChange={(e) => setTechnician(e.target.value)} />
            </div>
            <div>
              <label className="label">Empresa</label>
              <input className="input text-xs" placeholder="Nome da empresa" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="btn-primary py-2 text-xs" onClick={handleSearch} disabled={loading}>
              <Search size={14} /> {loading ? 'Buscando...' : 'Buscar'}
            </button>
            {searched && closures.length > 0 && (
              <button className="btn-yellow py-2 text-xs" onClick={handleExcel}>
                <FileSpreadsheet size={14} /> Exportar Excel
              </button>
            )}
          </div>
        </div>

        {/* Resultados */}
        {searched && (
          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">
                {closures.length} resultado{closures.length !== 1 ? 's' : ''}
              </p>
              {closures.length > 0 && (
                <button className="btn-yellow py-1.5 text-xs" onClick={handleExcel}>
                  <Download size={13} /> Excel
                </button>
              )}
            </div>

            {closures.length === 0 && (
              <p className="p-6 text-sm text-gray-400 text-center">
                Nenhum fechamento encontrado com os filtros informados.
              </p>
            )}

            <div className="overflow-x-auto">
              {closures.length > 0 && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-500 bg-gray-50">
                      <th className="px-4 py-2 font-semibold">Data</th>
                      <th className="px-4 py-2 font-semibold">Ticket</th>
                      <th className="px-4 py-2 font-semibold">Atendimento</th>
                      <th className="px-4 py-2 font-semibold">Empresa</th>
                      <th className="px-4 py-2 font-semibold">Técnico</th>
                      <th className="px-4 py-2 font-semibold">Materiais</th>
                      <th className="px-4 py-2 font-semibold">Serviços</th>
                      <th className="px-4 py-2 font-semibold">PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closures.map((c) => (
                      <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap text-gray-600">{formatDateBR(c.created_at)}</td>
                        <td className="px-4 py-2 font-semibold text-gray-800">#{c.ticket_id}</td>
                        <td className="px-4 py-2 text-gray-700">{c.ticket_name}</td>
                        <td className="px-4 py-2 text-gray-600">{c.company}</td>
                        <td className="px-4 py-2 text-gray-600">{c.technician_name}</td>
                        <td className="px-4 py-2 text-gray-500 max-w-[160px]">
                          {(c.closure_materials ?? []).map((m) =>
                            `${m.material_name} (${formatQuantity(m.quantity)})`
                          ).join('; ') || '—'}
                        </td>
                        <td className="px-4 py-2 text-gray-500 max-w-[160px]">
                          {(c.closure_services ?? []).map((s) => s.service_name).join('; ') || '—'}
                        </td>
                        <td className="px-4 py-2">
                          {c.pdf_url ? (
                            <div className="flex gap-1">
                              <a href={c.pdf_url} target="_blank" rel="noreferrer"
                                 className="p-1 rounded text-white" style={{ background: 'var(--green)' }}>
                                <Download size={12} />
                              </a>
                              <a href={buildWhatsAppLink(c.ticket_id, c.pdf_url)} target="_blank" rel="noreferrer"
                                 className="p-1 rounded" style={{ background: 'var(--yellow)', color: 'var(--green-dark)' }}>
                                <Send size={12} />
                              </a>
                            </div>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
