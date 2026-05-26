import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Verifica se o request tem sessão Supabase válida.
 * Retorna NextResponse 401 se não autenticado, null se OK.
 *
 * Uso:
 *   const authError = await requireAuth(request)
 *   if (authError) return authError
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          // setAll não é necessário em route handlers (read-only)
          setAll() {},
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Faça login na área administrativa.' },
        { status: 401 }
      )
    }

    return null
  } catch {
    return NextResponse.json(
      { error: 'Erro ao verificar autenticação.' },
      { status: 500 }
    )
  }
}
