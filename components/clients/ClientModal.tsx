'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { NativeSelect } from '@/components/ui/native-select'
import { createClientRecord, updateClientRecord, deleteClientRecord } from '@/app/actions/clients'
import { Client, CLIENT_TYPES, HOW_FOUND } from '@/lib/types'
import { Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface ClientModalProps {
  open: boolean
  onClose: () => void
  client?: Client | null
}

const EMPTY: Partial<Client> = {
  name: '',
  type: '',
  contact_name: '',
  phone: '',
  email: '',
  address: '',
  how_found: '',
  active: true,
  notes: '',
}

export function ClientModal({ open, onClose, client }: ClientModalProps) {
  const router = useRouter()
  const [form, setForm] = useState<Partial<Client>>(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm(client || EMPTY)
  }, [client, open])

  function set(field: keyof Client, value: unknown) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name?.trim()) return
    setLoading(true)
    const payload = {
      name: form.name,
      type: form.type || null,
      contact_name: form.contact_name || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      how_found: form.how_found || null,
      active: form.active ?? true,
      notes: form.notes || null,
    }
    const result = client
      ? await updateClientRecord(client.id, payload)
      : await createClientRecord(payload)
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success(client ? 'Client updated' : 'Client added')
      router.refresh(); onClose()
    }
  }

  async function handleDelete() {
    if (!client) return
    if (!confirm('Delete this client? All linked jobs will lose their client link.')) return
    setLoading(true)
    const result = await deleteClientRecord(client.id)
    setLoading(false)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success('Client deleted')
      router.refresh(); onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{client ? `Edit — ${client.name}` : 'Add New Client'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Client / Organisation Name *</Label>
            <Input
              value={form.name || ''}
              onChange={e => set('name', e.target.value)}
              placeholder="Haart Harborne"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <NativeSelect value={form.type || ''} onChange={e => set('type', e.target.value)} placeholder="Select…">
                {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <Label>Contact Name</Label>
              <Input
                value={form.contact_name || ''}
                onChange={e => set('contact_name', e.target.value)}
                placeholder="Jane Smith"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                value={form.phone || ''}
                onChange={e => set('phone', e.target.value)}
                placeholder="0121 000 0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email || ''}
                onChange={e => set('email', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Address</Label>
            <Input
              value={form.address || ''}
              onChange={e => set('address', e.target.value)}
              placeholder="1 High Street, Birmingham, B1 1AA"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>How They Found Us</Label>
              <NativeSelect value={form.how_found || ''} onChange={e => set('how_found', e.target.value)} placeholder="Select…">
                {HOW_FOUND.map(h => <option key={h} value={h}>{h}</option>)}
              </NativeSelect>
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 text-sm cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={form.active ?? true}
                  onChange={e => set('active', e.target.checked)}
                  className="h-4 w-4 rounded accent-[#16512a]"
                />
                Active client
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes || ''}
              onChange={e => set('notes', e.target.value)}
              placeholder="Key relationship notes…"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {client ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#16512a] hover:bg-[#0f3d1e] text-white"
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : client ? 'Save changes' : 'Add client'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
