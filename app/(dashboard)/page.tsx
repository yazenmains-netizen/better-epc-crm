export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/dashboard/StatCard'
import { DashboardFilters } from '@/components/dashboard/DashboardFilters'
import { Briefcase, TrendingUp, AlertCircle, Receipt, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { STATUS_COLOURS, Job, Client } from '@/lib/types'
import { format } from 'date-fns'

function formatCurrency(n: number) {
  return `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const { month: monthParam } = await searchParams
  const supabase = await createClient()

  const now = new Date()
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const selectedMonth = monthParam || currentMonthStr
  const isAllTime = selectedMonth === 'all'

  const [selYear, selMonth] = isAllTime ? [0, 0] : selectedMonth.split('-').map(Number)
  const firstOfMonth = isAllTime ? '' : new Date(selYear, selMonth - 1, 1).toISOString().split('T')[0]
  const lastOfMonth = isAllTime ? '' : new Date(selYear, selMonth, 0).toISOString().split('T')[0]

  let expensesQuery = supabase.from('expenses').select('amount')
  if (!isAllTime) {
    expensesQuery = expensesQuery.gte('date', firstOfMonth).lte('date', lastOfMonth)
  }

  const [
    { data: jobs },
    { data: expenses },
    { data: recentJobs },
    { data: unpaidInvoices },
    { data: recentClients },
    { data: pendingComms },
  ] = await Promise.all([
    supabase.from('jobs').select('status, fee, paid, invoice_sent, date_paid, deposit_paid, deposit_amount'),
    expensesQuery,
    supabase
      .from('jobs')
      .select('id, ref, status, service, property_address, fee, clients(name)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('jobs')
      .select('id, ref, property_address, fee, status, clients(name)')
      .eq('status', 'Invoice Sent')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('clients')
      .select('id, name, type, active')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('comms_queue')
      .select('id, type, recipient, subject, body, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ])

  const allJobs = jobs || []
  const activeJobs = allJobs.filter(j => j.status !== 'Paid' && j.status !== 'Cancelled').length
  // Revenue = deposit when deposit_paid, + remainder when fully paid
  function jobRevenue(j: { fee?: number | null; deposit_paid?: boolean | null; deposit_amount?: number | null; paid?: boolean | null }) {
    let r = 0
    if (j.deposit_paid) r += (j.deposit_amount || 0)
    if (j.paid) r += Math.max(0, (j.fee || 0) - (j.deposit_amount || 0))
    return r
  }
  const revenue = allJobs.reduce((sum, j) => sum + jobRevenue(j), 0)
  const outstandingTotal = allJobs
    .filter(j => j.status === 'Invoice Sent')
    .reduce((sum, j) => sum + (j.fee || 0), 0)
  const expensesTotal = (expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0)

  const monthLabel = isAllTime
    ? 'All time'
    : new Date(selYear, selMonth - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const isCurrentMonth = selectedMonth === currentMonthStr

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAllTime ? 'All time totals' : isCurrentMonth ? format(now, 'EEEE, d MMMM yyyy') : monthLabel}
          </p>
        </div>
        <DashboardFilters currentMonth={selectedMonth} />
      </div>

      {/* Pending Messages banner */}
      {(pendingComms ?? []).length > 0 && (
        <Link
          href="/comms"
          className="flex items-center gap-3 px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold shrink-0">
            {(pendingComms ?? []).length}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {(pendingComms ?? []).length} message{(pendingComms ?? []).length !== 1 ? 's' : ''} waiting for approval
            </p>
            <p className="text-xs text-amber-700">Click to review in Communications →</p>
          </div>
          <MessageSquare className="h-4 w-4 text-amber-500 ml-auto shrink-0" />
        </Link>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Active Jobs"
          value={String(activeJobs)}
          subtitle="not yet paid or cancelled"
          icon={Briefcase}
          colour="blue"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(revenue)}
          subtitle={isAllTime ? 'total fees charged' : monthLabel}
          icon={TrendingUp}
          colour="green"
        />
        <StatCard
          title="Outstanding Invoices"
          value={formatCurrency(outstandingTotal)}
          subtitle="invoice sent, awaiting payment"
          icon={AlertCircle}
          colour="orange"
        />
        <StatCard
          title="Expenses"
          value={formatCurrency(expensesTotal)}
          subtitle={monthLabel}
          icon={Receipt}
          colour="red"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Jobs */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Jobs</h2>
            <Link href="/jobs" className="text-sm text-[#16512a] hover:underline font-medium">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentJobs || []).length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No jobs yet.</p>
            ) : (
              (recentJobs as unknown as Job[]).map((job) => (
                <div key={job.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {job.ref ? `${job.ref} · ` : ''}{job.property_address || 'No address'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {job.clients?.name || '—'} · {job.service || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <span className="text-sm font-medium text-gray-900">
                      {job.fee ? `£${job.fee}` : '—'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOURS[job.status] || 'bg-gray-100 text-gray-600'}`}>
                      {job.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Unpaid Invoices + Clients column */}
        <div className="space-y-6">
          {/* Awaiting Payment */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Awaiting Payment</h2>
              <Link href="/jobs" className="text-sm text-[#16512a] hover:underline font-medium">
                View →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(unpaidInvoices || []).length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">All clear!</p>
              ) : (
                (unpaidInvoices as unknown as Job[]).map((job) => (
                  <div key={job.id} className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900">{job.ref || '—'}</p>
                    <p className="text-xs text-gray-500 truncate">{job.property_address || '—'}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">
                        {job.clients?.name || '—'}
                      </span>
                      <span className="text-sm font-semibold text-[#16512a]">
                        {job.fee ? `£${job.fee}` : '—'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Clients */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Clients</h2>
              <Link href="/clients" className="text-sm text-[#16512a] hover:underline font-medium">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {(recentClients || []).length === 0 ? (
                <p className="px-5 py-6 text-sm text-gray-400 text-center">No clients yet.</p>
              ) : (
                (recentClients as unknown as Client[]).map((client) => (
                  <Link
                    key={client.id}
                    href={`/clients/${client.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-500">{client.type || '—'}</p>
                    </div>
                    {client.active && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
