'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { createExpense, updateExpense, deleteExpense } from '@/app/actions/expenses'
import { Expense, EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/types'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const BUSINESS_PAYMENT_METHODS = ['Business Card', 'Personal Card (reclaim)', 'Bank Transfer', 'Cash']

interface ExpenseModalProps {
  open: boolean
  onClose: () => void
  expense?: Expense | null
}

const EMPTY: Partial<Expense> = {
  description: '',
  date: '',
  category: '',
  supplier: '',
  amount: undefined,
  payment_method: '',
  has_receipt: false,
  tax_deductible: true,
  notes: '',
}

export function ExpenseModal({ open, onClose, expense }: ExpenseModalProps) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Expense>>(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => { setForm(expense || EMPTY) }, [expense, open])

  function set(field: keyof Expense, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const payload = {
      description: form.description,
      date: form.date || null,
      category: form.category || null,
      supplier: form.supplier || null,
      amount: form.amount ? Number(form.amount) : null,
      payment_method: form.payment_method || null,
      has_receipt: form.has_receipt ?? false,
      tax_deductible: form.tax_deductible ?? true,
      notes: form.notes || null,
    }
    const result = expense ? await updateExpense(expense.id, payload) : await createExpense(payload)
    setLoading(false)
    if (result?.error) toast.error(result.error)
    else { toast.success(expense ? 'Expense updated' : 'Expense added'); router.refresh(); onClose() }
  }

  async function handleDelete() {
    if (!expense) return
    if (!confirm('Delete this expense?')) return
    setLoading(true)
    const result = await deleteExpense(expense.id)
    setLoading(false)
    if (result?.error) toast.error(result.error)
    else { toast.success('Expense deleted'); router.refresh(); onClose() }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Input value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="Branded jacket" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date || ''} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <NativeSelect value={form.category || ''} onChange={e => set('category', e.target.value)} placeholder="Select…">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </NativeSelect>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Supplier / Payee</Label>
              <Input value={form.supplier || ''} onChange={e => set('supplier', e.target.value)} placeholder="Amazon" />
            </div>
            <div className="space-y-1.5">
              <Label>Amount (£)</Label>
              <Input type="number" value={form.amount ?? ''} onChange={e => set('amount', e.target.value ? Number(e.target.value) : undefined)} placeholder="75" min="0" step="0.01" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Payment Method</Label>
            <NativeSelect value={form.payment_method || ''} onChange={e => set('payment_method', e.target.value)} placeholder="Select…">
              {BUSINESS_PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
            </NativeSelect>
          </div>

          <div className="flex gap-6">
            {[['has_receipt', 'Receipt obtained'], ['tax_deductible', 'Tax deductible']].map(([field, label]) => (
              <label key={field} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={!!form[field as keyof Expense]} onChange={e => set(field as keyof Expense, e.target.checked)} className="h-4 w-4 accent-[#16512a]" />
                {label}
              </label>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2} />
          </div>

          <div className="flex items-center justify-between pt-2">
            {expense ? (
              <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={handleDelete} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-1.5" />Delete
              </Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
              <Button type="submit" className="bg-[#16512a] hover:bg-[#0f3d1e] text-white" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : expense ? 'Save' : 'Add expense'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
