import { NextRequest, NextResponse } from 'next/server'
import { getTicketById } from '@/lib/googleSheets'

export const dynamic = 'force-dynamic' // API route — nunca fazer cache estático

// Fix 5: Google Sheets pode demorar na primeira cold start
export const maxDuration = 15

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')?.trim()
  if (!id) {
    return NextResponse.json({ error: 'ID do ticket não informado.' }, { status: 400 })
  }

  try {
    const ticket = await getTicketById(id)
    if (!ticket) {
      return NextResponse.json(
        { error: `Ticket "${id}" não encontrado na planilha.` },
        { status: 404 }
      )
    }
    return NextResponse.json({ ticket })
  } catch (error: any) {
    console.error('[GET /api/tickets]', error)
    return NextResponse.json(
      { error: error.message ?? 'Erro ao buscar ticket.' },
      { status: 500 }
    )
  }
}
