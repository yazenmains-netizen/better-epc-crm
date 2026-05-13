'use client'

import { useState } from 'react'
import { Expense } from '@/lib/types'
import { ExpenseModal } from './ExpenseModal'
import { Button } from '@/components/ui/button'
import { Plus, CheckCircle2, Circle, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ExpensesClient({ initialExpenses }: { initialExpenses: Expense[] }) {
  const [filter, setFilter] = useState('All')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Expense | null>(null)

  const categories = ['All', ...Array.from(new Set(initialExpenses.map(e => e.category).filter(Boolean))) as string[]]

  const filtered = filter === 'All'
    ? initialExpenses
    : initialExpenses.filter(e => e.category === filter)

  const total = filtered.reduce((s, e) => s + (e.amount || 0), 0)

  function openEdit(exp: Expense) { setEditing(exp); setModalOpen(true) }
  function openNew() { setEditing(null); setModalOpen(true) }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{filtered.length} records · £{total.toFixed(2)} total</p>
        </div>
        <Button onClick={openNew} className="bg-[#16512a] hover:bg-[#0f3d1e] text-white">
          <Plus className="h-4 w-4 mr-2" />Add expense
        </Button>
      </div>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-full font-medium transition-colors border',
              filter === c ? 'bg-[#16512a] text-white border-[#16512a]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            )}
          >{c}</button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center py-12 text-sm text-gray-400">No expenses found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Supplier</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">Receipt</th>
                <th className="px-5 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tax</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openEdit(exp)}>
                  <td className="px-5 py-3 text-gray-500 text-xs">{exp.date || '—'}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{exp.description}</td>
                  <td className="px-5 py-3">
                    {exp.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{exp.category}</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{exp.supplier || '—'}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900">{exp.amount ? `£${exp.amount}` : '—'}</td>
                  <td className="px-5 py-3 text-center">
                    {exp.has_receipt
                      ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                      : <Circle className="h-4 w-4 text-gray-300 mx-auto" />}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {exp.tax_deductible
                      ? <CheckCircle2 className="h-4 w-4 text-blue-500 mx-auto" />
                      : <Circle className="h-4 w-4 text-gray-300 mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t border-gray-200">
              <tr>
                <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-gray-600 uppercase">Total</td>
                <td className="px-5 py-3 text-right font-bold text-gray-900">£{total.toFixed(2)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <ExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} expense={editing} />
    </>
  )
}
