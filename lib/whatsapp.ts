export function buildWhatsAppLink(ticketId: string, pdfUrl: string): string {
  const message = `Olá, segue relatório de fechamento técnico do ticket ${ticketId}: ${pdfUrl}`
  return `https://wa.me/?text=${encodeURIComponent(message)}`
}
