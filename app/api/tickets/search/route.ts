import { NextRequest, NextResponse } from 'next/server'
import { searchTickets } from '@/lib/googleSheets'

export const dynamic = 'force-dynamic'
export const maxDuration = 15

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ tickets: [] })
  }

  try {
    const tickets = await searchTickets(query)
    return NextResponse.json({ tickets })
  } catch (error: any) {
    console.error('[GET /api/tickets/search]', error)
    return NextResponse.json(
      { error: error.message ?? 'Erro ao buscar tickets.' },
      { status: 500 }
    )
  }
}
