'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Trash2, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminAccountDeletionsPage() {
  const { isAuthenticated } = useAdminAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/api/v1/admin/account-deletions')
      setItems(res.data.items || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { if (isAuthenticated) load() }, [isAuthenticated, load])

  const handleApprove = async (id: string) => {
    if (!confirm('Bu hesabı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return
    setActionLoading(id + '-approve')
    try {
      await adminFetch(`/api/v1/admin/account-deletions/${id}/approve`, { method: 'POST' })
      toast.success('Hesap silindi.')
      load()
    } catch (e: any) { toast.error(e.message) }
    finally { setActionLoading(null) }
  }

  const handleReject = async (id: string) => {
    const note = prompt('Red gerekçesi:')
    if (!note) return
    setActionLoading(id + '-reject')
    try {
      await adminFetch(`/api/v1/admin/account-deletions/${id}/reject`, { method: 'POST', body: JSON.stringify({ note }) })
      toast.success('Talep reddedildi.')
      load()
    } catch (e: any) { toast.error(e.message) }
    finally { setActionLoading(null) }
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Trash2 className="w-6 h-6 text-red-400" />
          Hesap Silme Talepleri
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Kullanıcı hesap silme istekleri</p>
      </div>

      <div className="space-y-3">
        {loading ? <div className="p-8 text-center text-slate-500">Yükleniyor...</div> :
          items.length === 0 ? <div className="p-8 text-center text-slate-500">Talep yok</div> :
            items.map((item) => (
              <Card key={item.id} className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{item.user?.fullName} ({item.user?.email})</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(item.createdAt).toLocaleString('tr-TR')}</p>
                    </div>
                    <Badge className={`flex-shrink-0 ${item.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' : item.status === 'COMPLETED' ? 'bg-red-500/20 text-red-300' : 'bg-slate-500/20 text-slate-300'}`}>
                      {item.status === 'PENDING' ? 'Beklemede' : item.status === 'COMPLETED' ? 'Silindi' : 'Reddedildi'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-2"><strong>Sebep:</strong> {item.reason}</p>
                  {item.feedback && <p className="text-xs text-slate-500 mt-1"><strong>Geri bildirim:</strong> {item.feedback}</p>}
                  {item.status === 'PENDING' && (
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => handleApprove(item.id)} disabled={actionLoading === item.id + '-approve'}>
                        {actionLoading === item.id + '-approve' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Check className="w-3 h-3 mr-1" />}
                        Onayla & Sil
                      </Button>
                      <Button size="sm" variant="outline" className="border-slate-700" onClick={() => handleReject(item.id)} disabled={actionLoading === item.id + '-reject'}>
                        {actionLoading === item.id + '-reject' ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
                        Reddet
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
        }
      </div>
    </div>
  )
}
