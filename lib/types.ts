// ============================================================
// Tipos globais do sistema
// ============================================================

export interface TicketData {
  ticket_id: string
  ticket_name: string
  company: string
}

export interface Material {
  id: string
  name: string
  unit: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface ServiceType {
  id: string
  name: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface ClosureMaterialInput {
  material_id: string
  material_name: string
  unit: string
  quantity: number
}

export interface ClosureServiceInput {
  service_type_id: string
  service_name: string
  quantity_or_note: string
}

export interface CreateClosurePayload {
  ticket_id: string
  ticket_name: string
  company: string
  technician_name: string
  notes: string
  materials: ClosureMaterialInput[]
  services: ClosureServiceInput[]
}

export interface ClosureMaterial {
  id: string
  closure_id: string
  material_id: string | null
  material_name: string
  unit: string
  quantity: number
  created_at: string
}

export interface ClosureService {
  id: string
  closure_id: string
  service_type_id: string | null
  service_name: string
  quantity_or_note: string
  created_at: string
}

export interface TicketClosure {
  id: string
  ticket_id: string
  ticket_name: string
  company: string
  technician_name: string
  notes: string | null
  pdf_url: string | null
  created_at: string
  updated_at: string
  closure_materials?: ClosureMaterial[]
  closure_services?: ClosureService[]
}

export interface ReportFilters {
  date_from?: string
  date_to?: string
  technician_name?: string
  company?: string
}
