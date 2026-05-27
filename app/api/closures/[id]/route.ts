import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { generateClosurePDF } from '@/lib/pdfGenerator'
import { TicketClosure } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

// GET — busca um fechamento pelo ID (público, usado na tela de edição)
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { data, error } = await supabaseAdmin
    .from('ticket_closures')
    .select('*, closure_materials(*), closure_services(*)')
    .eq('id', params.id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Fechamento não encontrado.' }, { status: 404 })
  }
  return NextResponse.json({ closure: data })
}

// PUT — atualiza fechamento, materiais e serviços e regera o PDF
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { technician_name, notes, materials, services } = body

    if (!technician_name?.trim())
      return NextResponse.json({ error: 'Nome do técnico é obrigatório.' }, { status: 400 })

    // ── Atualizar campos do fechamento ───────────────────────
    const { error: updError } = await supabaseAdmin
      .from('ticket_closures')
      .update({ technician_name: technician_name.trim(), notes: notes ?? null })
      .eq('id', params.id)

    if (updError) throw new Error(updError.message)

    // ── Substituir materiais (apaga e recria) ─────────────────
    await supabaseAdmin.from('closure_materials').delete().eq('closure_id', params.id)

    if (materials?.length > 0) {
      const { error: matsError } = await supabaseAdmin
        .from('closure_materials')
        .insert(materials.map((m: any) => ({
          closure_id: params.id,
          material_id: m.material_id || null,
          material_name: m.material_name,
          unit: m.unit,
          quantity: m.quantity,
        })))
      if (matsError) throw new Error(matsError.message)
    }

    // ── Substituir serviços ───────────────────────────────────
    await supabaseAdmin.from('closure_services').delete().eq('closure_id', params.id)

    if (services?.length > 0) {
      const { error: svcsError } = await supabaseAdmin
        .from('closure_services')
        .insert(services.map((s: any) => ({
          closure_id: params.id,
          service_type_id: s.service_type_id || null,
          service_name: s.service_name,
          quantity_or_note: s.quantity_or_note ?? null,
        })))
      if (svcsError) throw new Error(svcsError.message)
    }

    // ── Buscar fechamento completo para regerar PDF ───────────
    const { data: fullClosure, error: fetchError } = await supabaseAdmin
      .from('ticket_closures')
      .select('*, closure_materials(*), closure_services(*)')
      .eq('id', params.id)
      .single()

    if (fetchError) throw new Error(fetchError.message)

    // ── Regerar PDF ───────────────────────────────────────────
    const pdfBuffer = generateClosurePDF(fullClosure as TicketClosure)
    const fileName  = `${params.id}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('reports')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (uploadError) throw new Error(uploadError.message)

    const { data: urlData } = supabaseAdmin.storage.from('reports').getPublicUrl(fileName)
    const pdfUrl = urlData.publicUrl

    await supabaseAdmin
      .from('ticket_closures')
      .update({ pdf_url: pdfUrl })
      .eq('id', params.id)

    return NextResponse.json({ id: params.id, pdf_url: pdfUrl })
  } catch (err: any) {
    console.error('[PUT /api/closures/[id]]', err)
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}
