'use client'

import { useState } from 'react'
import { Mileage, Job } from '@/lib/types'
import { MileageModal } from './MileageModal'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function MileageClient({ initialTrips, jobs }: { initialTrips: Mileage[]; jobs: Job[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Mileage | null>(null)

  const totalMiles = initialTrips.reduce((s, t) => s + (t.miles || 0), 0)
  const totalClaim = initialTrips.reduce((s, t) => s + (t.claim || 0), 0)

  function openEdit(trip: Mileage) { setEditing(trip); setModalOpen(true) }
  function openNew() { setEditing(null); setModalOpen(true) }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mileage</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {initialTrips.length} trips · {totalMiles.toFixed(1)} miles · £{totalClaim.toFixed(2)} total claim
          </p>
        </div>
        <Button onClick={openNew} className="bg-[#16512a] hover:bg-[#0f3d1e] text-white">
          <Plus className="h-4 w-4 mr-2" />Log trip
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{initialTrips.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total trips</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-purple-700">{totalMiles.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">Total miles</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-[#16512a]">£{totalClaim.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Total HMRC claim</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {initialTrips.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No trips logged yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Miles</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Claim (£)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {initialTrips.map(trip => (
                <tr key={trip.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(trip)}>
                  <td className="px-5 py-3 text-gray-500 text-xs">{trip.date || '—'}</td>
                  <td className="px-5 py-3">
                    <p className="text-gray-800 text-xs">
                      {trip.from_location && trip.to_location
                        ? `${trip.from_location} → ${trip.to_location}`
                        : trip.trip_name || '—'}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-xs">{trip.purpose || '—'}</td>
                  <td className="px-5 py-3 text-gray-600 font-mono text-xs">{(trip.jobs as Record<string, unknown> | null)?.ref as string || '—'}</td>
                  <td className="px-5 py-3 text-right text-gray-900">{trip.miles ?? '—'}</td>
                  <td className="px-5 py-3 text-right text-gray-500 text-xs">£{trip.rate}</td>
                  <td className="px-5 py-3 text-right font-semibold text-[#16512a]">
                    £{trip.claim?.toFixed(2) ?? ((trip.miles || 0) * (trip.rate || 0.45)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Total</td>
                <td className="px-5 py-3 text-right font-bold text-gray-900">{totalMiles.toFixed(1)}</td>
                <td />
                <td className="px-5 py-3 text-right font-bold text-[#16512a]">£{totalClaim.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <MileageModal open={modalOpen} onClose={() => setModalOpen(false)} trip={editing} jobs={jobs} />
    </>
  )
}
