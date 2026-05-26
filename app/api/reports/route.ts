import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/authHelper'
import { generateClosuresExcel } from '@/lib/excelGenerator'
import { TicketClosure } from '@/lib/types'

export const dynamic = 'force-dynamic' // API route — nunca fazer cache estático

export const maxDuration = 30

// GET — protegido: apenas admin autenticado
export async function GET(request: NextRequest) {
  // Fix 1: relatórios contêm dados sensíveis — exigir autenticação
  const authError = await requireAuth(request)
  if (authError) return authError

  const { searchParams } = request.nextUrl
  const dateFrom   = searchParams.get('date_from')
  const dateTo     = searchParams.get('date_to')
  const technician = searchParams.get('technician')
  const company    = searchParams.get('company')
  const format     = searchParams.get('format')

  let query = supabaseAdmin
    .from('ticket_closures')
    .select('*, closure_materials(*), closure_services(*)')
    .order('created_at', { ascending: false })
    .limit(500)

  if (dateFrom)   query = query.gte('created_at', `${dateFrom}T00:00:00`)
  if (dateTo)     query = query.lte('created_at', `${dateTo}T23:59:59`)
  if (technician) query = query.ilike('technician_name', `%${technician}%`)
  if (company)    query = query.ilike('company', `%${company}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (format === 'excel') {
    const excelBuf  = generateClosuresExcel(data as TicketClosure[])
    const buffer    = new Uint8Array(excelBuf)
    const timestamp = new Date().toISOString().slice(0, 10)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="emcale-relatorio-${timestamp}.xlsx"`,
      },
    })
  }

  return NextResponse.json({ closures: data })
}
