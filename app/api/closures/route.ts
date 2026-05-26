import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/authHelper'
import { generateClosurePDF } from '@/lib/pdfGenerator'
import { CreateClosurePayload, TicketClosure } from '@/lib/types'

export const dynamic = 'force-dynamic' // API route — nunca fazer cache estático

export const maxDuration = 30

// POST — aberto ao técnico (sem login)
export async function POST(request: NextRequest) {
  try {
    const payload: CreateClosurePayload = await request.json()

    if (!payload.ticket_id?.trim())
      return NextResponse.json({ error: 'ticket_id ausente.' }, { status: 400 })
    if (!payload.technician_name?.trim())
      return NextResponse.json({ error: 'Nome do técnico ausente.' }, { status: 400 })
    if (!payload.materials?.length && !payload.services?.length)
      return NextResponse.json({ error: 'Adicione ao menos um material ou serviço.' }, { status: 400 })

    // ── Inserir fechamento ───────────────────────────────────
    const { data: closure, error: closureError } = await supabaseAdmin
      .from('ticket_closures')
      .insert({
        ticket_id:       payload.ticket_id.trim(),
        ticket_name:     payload.ticket_name,
        company:         payload.company,
        technician_name: payload.technician_name.trim(),
        notes:           payload.notes ?? null,
      })
      .select()
      .single()

    if (closureError) throw new Error(closureError.message)

    // ── Inserir materiais ────────────────────────────────────
    if (payload.materials?.length > 0) {
      const { error } = await supabaseAdmin
        .from('closure_materials')
        .insert(
          payload.materials.map((m) => ({
            closure_id:    closure.id,
            material_id:   m.material_id || null,
            material_name: m.material_name,
            unit:          m.unit,
            quantity:      m.quantity,
          }))
        )
      if (error) throw new Error(`Materiais: ${error.message}`)
    }

    // ── Inserir serviços ─────────────────────────────────────
    if (payload.services?.length > 0) {
      const { error } = await supabaseAdmin
        .from('closure_services')
        .insert(
          payload.services.map((s) => ({
            closure_id:       closure.id,
            service_type_id:  s.service_type_id || null,
            service_name:     s.service_name,
            quantity_or_note: s.quantity_or_note ?? null,
          }))
        )
      if (error) throw new Error(`Serviços: ${error.message}`)
    }

    // ── Buscar fechamento completo para o PDF ────────────────
    const { data: fullClosure, error: fetchError } = await supabaseAdmin
      .from('ticket_closures')
      .select('*, closure_materials(*), closure_services(*)')
      .eq('id', closure.id)
      .single()

    if (fetchError) throw new Error(`Busca: ${fetchError.message}`)

    // ── Gerar e fazer upload do PDF ──────────────────────────
    const pdfBuffer = generateClosurePDF(fullClosure as TicketClosure)
    const fileName  = `${closure.id}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('reports')
      .upload(fileName, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (uploadError) throw new Error(`Upload: ${uploadError.message}`)

    const { data: urlData } = supabaseAdmin.storage.from('reports').getPublicUrl(fileName)
    const pdfUrl = urlData.publicUrl

    const { error: updateError } = await supabaseAdmin
      .from('ticket_closures')
      .update({ pdf_url: pdfUrl })
      .eq('id', closure.id)

    if (updateError) throw new Error(`Update pdf_url: ${updateError.message}`)

    return NextResponse.json({ id: closure.id, pdf_url: pdfUrl }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/closures]', err)
    return NextResponse.json({ error: err.message ?? 'Erro interno.' }, { status: 500 })
  }
}

// GET — protegido: apenas admin autenticado
export async function GET(request: NextRequest) {
  // Fix 1: verificar autenticação antes de retornar dados sensíveis
  const authError = await requireAuth(request)
  if (authError) return authError

  const { searchParams } = request.nextUrl
  const dateFrom   = searchParams.get('date_from')
  const dateTo     = searchParams.get('date_to')
  const technician = searchParams.get('technician')
  const company    = searchParams.get('company')
  const limit      = Math.min(parseInt(searchParams.get('limit') ?? '200', 10), 500)

  let query = supabaseAdmin
    .from('ticket_closures')
    .select('*, closure_materials(*), closure_services(*)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (dateFrom)   query = query.gte('created_at', `${dateFrom}T00:00:00`)
  if (dateTo)     query = query.lte('created_at', `${dateTo}T23:59:59`)
  if (technician) query = query.ilike('technician_name', `%${technician}%`)
  if (company)    query = query.ilike('company', `%${company}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ closures: data })
}
