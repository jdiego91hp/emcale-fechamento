import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { requireAuth } from '@/lib/authHelper'

export const dynamic = 'force-dynamic' // API route — nunca fazer cache estático

// GET — público sem ?all=1 (técnico busca serviços ativos)
//     — protegido com ?all=1 (admin vê todos)
export async function GET(request: NextRequest) {
  const showAll = request.nextUrl.searchParams.get('all') === '1'

  if (showAll) {
    const authError = await requireAuth(request)
    if (authError) return authError
  }

  let query = supabaseAdmin.from('service_types').select('*').order('name')
  if (!showAll) query = query.eq('active', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ serviceTypes: data })
}

// POST — protegido: apenas admin
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { name } = body
  if (!name?.trim())
    return NextResponse.json({ error: 'Nome é obrigatório.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('service_types')
    .insert({ name: name.trim(), active: true })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ serviceType: data }, { status: 201 })
}

// PUT — protegido: apenas admin
export async function PUT(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError

  const body = await request.json()
  const { id, name, active } = body
  if (!id) return NextResponse.json({ error: 'ID é obrigatório.' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (name   !== undefined) updates.name   = name
  if (active !== undefined) updates.active = active

  const { data, error } = await supabaseAdmin
    .from('service_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ serviceType: data })
}
