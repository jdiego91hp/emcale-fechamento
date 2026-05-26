import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { TicketClosure } from './types'

const EMCALE_GREEN  = '#009C3B'
const EMCALE_YELLOW = '#FEDF00'
const DARK_TEXT     = '#1A1A1A'
const LIGHT_BG      = '#F5F5F5'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  })
}

function hexToRGB(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

// Fix 8+16: retorna Buffer (compatível com Supabase Storage upload em Node.js)
export function generateClosurePDF(closure: TicketClosure): Buffer {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth  = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14

  // ── Cabeçalho verde ─────────────────────────────────────────
  doc.setFillColor(...hexToRGB(EMCALE_GREEN))
  doc.rect(0, 0, pageWidth, 38, 'F')

  // Logo: descomente após adicionar /public/logo-emcale.png como base64
  // Exemplo: import fs from 'fs'; import path from 'path'
  // const logoPath = path.join(process.cwd(), 'public', 'logo-emcale.png')
  // const logoBase64 = fs.readFileSync(logoPath).toString('base64')
  // doc.addImage(`data:image/png;base64,${logoBase64}`, 'PNG', margin, 6, 40, 26)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO DE FECHAMENTO DE CHAMADO TÉCNICO', pageWidth / 2, 16, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Sistema de Fechamento Técnico Emcale', pageWidth / 2, 23, { align: 'center' })

  // Faixa amarela separadora
  doc.setFillColor(...hexToRGB(EMCALE_YELLOW))
  doc.rect(0, 38, pageWidth, 5, 'F')

  // ── Informações do chamado ───────────────────────────────────
  let y = 52
  doc.setTextColor(...hexToRGB(DARK_TEXT))
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('INFORMAÇÕES DO CHAMADO', margin, y)
  y += 2
  doc.setFillColor(...hexToRGB(EMCALE_GREEN))
  doc.rect(margin, y, pageWidth - margin * 2, 0.5, 'F')
  y += 6

  const labelX = margin
  const valueX = margin + 38
  const lineH  = 7

  const infoRows: [string, string][] = [
    ['Ticket ID:',    closure.ticket_id],
    ['Atendimento:', closure.ticket_name],
    ['Empresa:',     closure.company],
    ['Técnico:',     closure.technician_name],
    ['Data/Hora:',   formatDate(closure.created_at)],
  ]

  doc.setFontSize(9)
  infoRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, labelX, y)
    doc.setFont('helvetica', 'normal')
    doc.text(String(value ?? ''), valueX, y)
    y += lineH
  })

  y += 4

  // ── Materiais ───────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...hexToRGB(DARK_TEXT))
  doc.text('MATERIAIS UTILIZADOS', margin, y)
  y += 2
  doc.setFillColor(...hexToRGB(EMCALE_GREEN))
  doc.rect(margin, y, pageWidth - margin * 2, 0.5, 'F')
  y += 4

  const materialsBody = (closure.closure_materials ?? []).map((m) => [
    m.material_name,
    m.unit,
    String(m.quantity).replace('.', ','),
  ])

  autoTable(doc, {
    startY: y,
    head: [['Material', 'Unidade', 'Quantidade']],
    body: materialsBody.length > 0 ? materialsBody : [['Nenhum material registrado', '', '']],
    styles:         { fontSize: 9, cellPadding: 3 },
    headStyles:     { fillColor: hexToRGB(EMCALE_GREEN), textColor: [255, 255, 255] as [number,number,number], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: hexToRGB(LIGHT_BG) },
    columnStyles:   { 0: { cellWidth: 90 }, 1: { cellWidth: 40 }, 2: { cellWidth: 30 } },
    margin:         { left: margin, right: margin },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ── Serviços ─────────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...hexToRGB(DARK_TEXT))
  doc.text('SERVIÇOS REALIZADOS', margin, y)
  y += 2
  doc.setFillColor(...hexToRGB(EMCALE_GREEN))
  doc.rect(margin, y, pageWidth - margin * 2, 0.5, 'F')
  y += 4

  const servicesBody = (closure.closure_services ?? []).map((s) => [
    s.service_name,
    s.quantity_or_note ?? '—',
  ])

  autoTable(doc, {
    startY: y,
    head: [['Serviço', 'Qtd / Observação']],
    body: servicesBody.length > 0 ? servicesBody : [['Nenhum serviço registrado', '']],
    styles:         { fontSize: 9, cellPadding: 3 },
    headStyles:     { fillColor: hexToRGB(EMCALE_GREEN), textColor: [255, 255, 255] as [number,number,number], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: hexToRGB(LIGHT_BG) },
    columnStyles:   { 0: { cellWidth: 100 }, 1: { cellWidth: 62 } },
    margin:         { left: margin, right: margin },
  })

  y = (doc as any).lastAutoTable.finalY + 8

  // ── Observações ──────────────────────────────────────────────
  if (closure.notes?.trim()) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...hexToRGB(DARK_TEXT))
    doc.text('OBSERVAÇÕES', margin, y)
    y += 2
    doc.setFillColor(...hexToRGB(EMCALE_GREEN))
    doc.rect(margin, y, pageWidth - margin * 2, 0.5, 'F')
    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(closure.notes, pageWidth - margin * 2)
    doc.text(lines, margin, y)
  }

  // ── Rodapé ───────────────────────────────────────────────────
  doc.setFillColor(...hexToRGB(EMCALE_GREEN))
  doc.rect(0, pageHeight - 14, pageWidth, 14, 'F')
  doc.setFillColor(...hexToRGB(EMCALE_YELLOW))
  doc.rect(0, pageHeight - 14, pageWidth, 1.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'Documento gerado automaticamente pelo Sistema de Fechamento Técnico Emcale',
    pageWidth / 2,
    pageHeight - 5,
    { align: 'center' }
  )

  // Fix 8: output('arraybuffer') → Buffer via Uint8Array correto
  const arrayBuffer = doc.output('arraybuffer')
  return Buffer.from(arrayBuffer)
}
