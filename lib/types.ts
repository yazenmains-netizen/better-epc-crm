export type JobStatus =
  | 'New Lead'
  | 'Not Interested'
  | 'Deposit Paid'
  | 'Survey Booked'
  | 'Survey Complete'
  | 'Modelling Complete'
  | 'Awaiting Final Payment'
  | 'Report Released'
  | 'Cancelled'

export const KANBAN_COLUMNS: JobStatus[] = [
  'New Lead',
  'Not Interested',
  'Deposit Paid',
  'Survey Booked',
  'Survey Complete',
  'Modelling Complete',
  'Awaiting Final Payment',
  'Report Released',
]

export const JOB_STATUSES: JobStatus[] = [...KANBAN_COLUMNS, 'Cancelled']

export const STATUS_COLOURS: Record<JobStatus, string> = {
  'New Lead':               'bg-blue-100 text-blue-800 border-blue-200',
  'Not Interested':         'bg-red-100 text-red-700 border-red-200',
  'Deposit Paid':           'bg-amber-100 text-amber-800 border-amber-200',
  'Survey Booked':          'bg-purple-100 text-purple-800 border-purple-200',
  'Survey Complete':        'bg-teal-100 text-teal-800 border-teal-200',
  'Modelling Complete':     'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Awaiting Final Payment': 'bg-orange-100 text-orange-800 border-orange-200',
  'Report Released':        'bg-green-100 text-green-800 border-green-200',
  'Cancelled':              'bg-gray-100 text-gray-600 border-gray-200',
}

export const STATUS_COLUMN_COLOURS: Record<JobStatus, string> = {
  'New Lead':               'border-t-blue-400',
  'Not Interested':         'border-t-red-400',
  'Deposit Paid':           'border-t-amber-400',
  'Survey Booked':          'border-t-purple-400',
  'Survey Complete':        'border-t-teal-400',
  'Modelling Complete':     'border-t-indigo-400',
  'Awaiting Final Payment': 'border-t-orange-400',
  'Report Released':        'border-t-green-500',
  'Cancelled':              'border-t-gray-400',
}

export const CLIENT_TYPES = [
  'Direct Lead',
  'Referral',
  'Landlord',
  'Letting Agent',
  'Estate Agent',
  'Housing Association',
  'Other',
] as const

export const SERVICES = [
  'EPC Consultation',
  'EPC Assessment',
  'Energy Modelling',
  'EPC + Modelling',
] as const

export const SOURCES = [
  'Facebook Ads',
  'Google Ads',
  'Referral',
  'Direct',
  'Instagram',
  'Other',
] as const

export const HOW_FOUND = [
  'Facebook Ads',
  'Google Ads',
  'Referral',
  'Direct',
  'Social Media',
  'Other',
] as const

export const EXPENSE_CATEGORIES = [
  'Advertising',
  'Software/Subscriptions',
  'Equipment',
  'Travel',
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

export const ENGINEERS = [
  'Yazen Yafai',
  'Anees Farooq',
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
  deposit_amount: number | null
  deposit_paid: boolean
  invoice_sent: boolean
  paid: boolean
  date_paid: string | null
  payment_method: string | null
  source: string | null
  engineer: string | null
  notes: string | null
  created_at: string
  clients?: { id: string; name: string } | null
  email_sequence?: 'none' | 'day1' | 'day2' | 'day3' | 'weekly'
  sequence_started_at?: string | null
  sequence_last_sent_at?: string | null
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
