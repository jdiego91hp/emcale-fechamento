import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Emcale — Fechamento Técnico',
  description: 'Sistema de Fechamento de Chamados Técnicos Emcale',
}

// Fix 4: viewport exportado separadamente conforme Next.js 14+ exige
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  )
}
