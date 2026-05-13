import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Job, STATUS_COLOURS } from '@/lib/types'
import { ArrowLeft, Mail, Phone, MapPin } from 'lucide-react'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: jobs }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase
      .from('jobs')
      .select('*')
      .eq('client_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!client) notFound()

  const totalRevenue = (jobs || []).reduce((sum: number, j: Job) => sum + (j.fee || 0), 0)
  const paidJobs = (jobs || []).filter((j: Job) => j.paid).length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/clients" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="h-4 w-4" /> Back to clients
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            {client.type && (
              <span className="text-sm bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full mt-2 inline-block">
                {client.type}
              </span>
            )}
          </div>
          {client.active ? (
            <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Active</span>
          ) : (
            <span className="text-sm bg-gray-100 text-gray-500 px-3 py-1 rounded-full">Inactive</span>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {client.contact_name && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Contact</p>
              <p className="text-sm font-medium text-gray-800">{client.contact_name}</p>
            </div>
          )}
          {client.phone && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
              <a href={`tel:${client.phone}`} className="text-sm font-medium text-[#16512a] flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />{client.phone}
              </a>
            </div>
          )}
          {client.email && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
              <a href={`mailto:${client.email}`} className="text-sm font-medium text-[#16512a] flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />{client.email}
              </a>
            </div>
          )}
          {client.address && (
            <div className="col-span-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Address</p>
              <p className="text-sm text-gray-700 flex items-start gap-1">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />{client.address}
              </p>
            </div>
          )}
          {client.how_found && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">How Found</p>
              <p className="text-sm text-gray-700">{client.how_found}</p>
            </div>
          )}
        </div>

        {client.notes && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-gray-700">{client.notes}</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-blue-700">{(jobs || []).length}</p>
          <p className="text-xs text-gray-500 mt-1">Total jobs</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-green-700">£{totalRevenue.toFixed(0)}</p>
          <p className="text-xs text-gray-500 mt-1">Total revenue</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-[#16512a]">{paidJobs}</p>
          <p className="text-xs text-gray-500 mt-1">Paid jobs</p>
        </div>
      </div>

      {/* Jobs table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Job History</h2>
        </div>
        {(jobs || []).length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">No jobs for this client yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(jobs as Job[]).map(job => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-mono text-xs font-medium text-gray-700">{job.ref}</td>
                  <td className="px-5 py-3 text-gray-700 max-w-xs truncate">{job.property_address || '—'}</td>
                  <td className="px-5 py-3 text-gray-600">{job.service || '—'}</td>
                  <td className="px-5 py-3 font-medium">{job.fee ? `£${job.fee}` : '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOURS[job.status] || ''}`}>
                      {job.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
