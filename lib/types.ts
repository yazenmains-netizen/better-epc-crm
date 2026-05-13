export type JobStatus =
  | 'To Be Booked'
  | 'Booked In'
  | 'Completed'
  | 'Invoice Sent'
  | 'Paid'
  | 'Cancelled'

export const KANBAN_COLUMNS: JobStatus[] = [
  'To Be Booked',
  'Booked In',
  'Completed',
  'Invoice Sent',
  'Paid',
]

export const JOB_STATUSES: JobStatus[] = [...KANBAN_COLUMNS, 'Cancelled']

export const STATUS_COLOURS: Record<JobStatus, string> = {
  'To Be Booked': 'bg-orange-100 text-orange-800 border-orange-200',
  'Booked In': 'bg-purple-100 text-purple-800 border-purple-200',
  'Completed': 'bg-teal-100 text-teal-800 border-teal-200',
  'Invoice Sent': 'bg-amber-100 text-amber-800 border-amber-200',
  'Paid': 'bg-green-100 text-green-800 border-green-200',
  'Cancelled': 'bg-gray-100 text-gray-600 border-gray-200',
}

export const STATUS_COLUMN_COLOURS: Record<JobStatus, string> = {
  'To Be Booked': 'border-t-orange-400',
  'Booked In': 'border-t-purple-400',
  'Completed': 'border-t-teal-400',
  'Invoice Sent': 'border-t-amber-400',
  'Paid': 'border-t-green-500',
  'Cancelled': 'border-t-gray-400',
}


export const CLIENT_TYPES = [
  'Estate Agent',
  'Landlord',
  'Contractor',
  'Property Portfolio',
  'Direct Client',
  'Government',
  'Partner',
] as const

export const SERVICES = [
  'EPC',
  'Homebuyer Report',
  'Building Survey',
  'Damp & Mould Survey',
  'Gas Safety Certificate',
] as const

export const SOURCES = [
  'Direct',
  'Referral',
  'Haart Harborne',
  'Haart Wolverhampton',
  'Burchell Edwards',
  'Google',
  'Social Media',
  'Government',
  'Other',
] as const

export const HOW_FOUND = [
  'Google',
  'Referral',
  'Estate Agent',
  'Social Media',
  'Cold Outreach',
  'Other',
] as const

export const EXPENSE_CATEGORIES = [
  'Equipment',
  'Software/Subscriptions',
  'Travel',
  'Marketing',
  'Professional Fees',
  'Insurance',
  'Training',
  'Office',
  'Misc',
] as const

export const PAYMENT_METHODS = [
  'Bank Transfer',
  'Cash',
  'Card',
  'BACS',
] as const

export interface Client {
  id: string
  name: string
  type: string | null
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  how_found: string | null
  active: boolean
  notes: string | null
  created_at: string
}

export interface Job {
  id: string
  ref: string
  title: string | null
  status: JobStatus
  date: string | null
  time: string | null
  client_id: string | null
  client_type: string | null
  contact_phone: string | null
  contact_email: string | null
  property_address: string | null
  postcode: string | null
  service: string | null
  fee: number | null
  invoice_sent: boolean
  paid: boolean
  date_paid: string | null
  payment_method: string | null
  source: string | null
  review_requested: boolean
  review_received: boolean
  notes: string | null
  created_at: string
  clients?: { id: string; name: string } | null
}

export interface Invoice {
  id: string
  ref: string
  job_id: string | null
  client_id: string | null
  invoice_date: string | null
  due_date: string | null
  amount: number | null
  status: string | null
  payment_method: string | null
  date_paid: string | null
  notes: string | null
  created_at: string
  jobs?: { ref: string; property_address: string | null } | null
  clients?: { name: string } | null
}

export interface Expense {
  id: string
  description: string
  date: string | null
  category: string | null
  supplier: string | null
  amount: number | null
  payment_method: string | null
  has_receipt: boolean
  tax_deductible: boolean
  notes: string | null
  created_at: string
}

export interface Mileage {
  id: string
  trip_name: string | null
  date: string | null
  from_location: string | null
  to_location: string | null
  job_id: string | null
  purpose: string | null
  miles: number | null
  rate: number
  claim: number | null
  notes: string | null
  created_at: string
  jobs?: { ref: string } | null
}
