import { JWT } from 'google-auth-library'
import { TicketData } from './types'

async function getAccessToken(): Promise<string> {
  const client = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key:   process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const token = await client.getAccessToken()
  if (!token.token) throw new Error('Não foi possível obter token de acesso do Google.')
  return token.token
}

/**
 * Busca ticket por ID na planilha Google Sheets.
 *
 * Estrutura esperada (Aba "Tickets"):
 *   Coluna A: ticket_id   — identificador único
 *   Coluna B: ticket_name — nome do atendimento / cliente
 *   Coluna C: company     — empresa
 *
 * Linha 1 = cabeçalho (ignorada).
 */
/**
 * Busca tickets que começam com o texto digitado (para autocomplete).
 * Retorna até 10 resultados.
 */
export async function searchTickets(query: string): Promise<TicketData[]> {
  try {
    const token         = await getAccessToken()
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!
    const range         = encodeURIComponent('Tickets!A2:C')
    const url           = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Google Sheets API ${res.status}: ${body}`)
    }

    const json = await res.json()
    const rows: string[][] = json.values ?? []

    if (rows.length === 0) return []

    const queryUpper = query.toUpperCase().trim()
    const matches = rows
      .filter((r) => r[0]?.toString().toUpperCase().trim().includes(queryUpper))
      .slice(0, 10)
      .map((row) => ({
        ticket_id:   row[0]?.toString().trim() ?? '',
        ticket_name: row[1]?.toString().trim() ?? '',
        company:     row[2]?.toString().trim() ?? '',
      }))

    return matches
  } catch (error: any) {
    console.error('[googleSheets.searchTickets]', error)
    throw new Error(`Falha ao consultar planilha: ${error.message}`)
  }
}

export async function getTicketById(ticketId: string): Promise<TicketData | null> {
  try {
    const token         = await getAccessToken()
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID!
    const range         = encodeURIComponent('Tickets!A2:C')
    const url           = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`

    // Fix 6: sem cache (no-store) — tickets podem ser adicionados a qualquer hora
    // e precisamos que a busca sempre retorne dados atualizados
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Google Sheets API ${res.status}: ${body}`)
    }

    const json = await res.json()
    const rows: string[][] = json.values ?? []

    if (rows.length === 0) return null

    const row = rows.find((r) => r[0]?.toString().trim() === ticketId.trim())
    if (!row) return null

    return {
      ticket_id:   row[0]?.toString().trim() ?? '',
      ticket_name: row[1]?.toString().trim() ?? '',
      company:     row[2]?.toString().trim() ?? '',
    }
  } catch (error: any) {
    console.error('[googleSheets.getTicketById]', error)
    throw new Error(`Falha ao consultar planilha: ${error.message}`)
  }
}
