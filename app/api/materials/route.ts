import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/authHelper'

export const dynamic = 'force-dynamic' // API route — nunca fazer cache estático

// GET — público sem ?all=1 (técnico busca materiais ativos)
//     — protegido com ?all=1 (admin vê todos, incluindo inativos)
export async function GET(request: NextRequest) {
  const showAll = request.nextUrl.searchParams.get('all') === '1'

  // Fix 1: ?all=1 é endpoint admin → exige autenticação
  if (showAll) {
    const authError = await requireAuth(request)
    if (authError) return authError
  }

  let query = supabaseAdmin.from('materials').select('*').order('name')
  if (!showAll) query = query.eq('active', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ materials: data })
}

// POST — protegido: apenas admin
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { name, unit } = body
  if (!name?.trim() || !unit?.trim())
    return NextResponse.json({ error: 'Nome e unidade são obrigatórios.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('materials')
    .insert({ name: name.trim(), unit: unit.trim(), active: true })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data }, { status: 201 })
}

// PUT — protegido: apenas admin
export async function PUT(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { id, name, unit, active } = body
  if (!id) return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (name   !== undefined) updates.name   = name
  if (unit   !== undefined) updates.unit   = unit
  if (active !== undefined) updates.active = active

  const { data, error } = await supabaseAdmin
    .from('materials')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ material: data })
}
