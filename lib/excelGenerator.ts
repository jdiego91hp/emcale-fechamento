import * as XLSX from 'xlsx'
import { TicketClosure } from './types'

export function generateClosuresExcel(closures: TicketClosure[]): Buffer {
  const rows = closures.map((c) => ({
    'Data do Fechamento': new Date(c.created_at).toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    }),
    'ID Ticket': c.ticket_id,
    'Atendimento / Cliente': c.ticket_name,
    Empresa: c.company,
    Técnico: c.technician_name,
    Materiais: (c.closure_materials ?? [])
      .map((m) => `${m.material_name} (${m.quantity} ${m.unit})`)
      .join('; '),
    Serviços: (c.closure_services ?? [])
      .map((s) => `${s.service_name}${s.quantity_or_note ? `: ${s.quantity_or_note}` : ''}`)
      .join('; '),
    Observações: c.notes ?? '',
    'Link PDF': c.pdf_url ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Largura das colunas
  ws['!cols'] = [
    { wch: 22 }, // Data
    { wch: 16 }, // ID Ticket
    { wch: 30 }, // Atendimento
    { wch: 25 }, // Empresa
    { wch: 22 }, // Técnico
    { wch: 55 }, // Materiais
    { wch: 55 }, // Serviços
    { wch: 40 }, // Observações
    { wch: 50 }, // PDF
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Fechamentos')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  return buf
}
