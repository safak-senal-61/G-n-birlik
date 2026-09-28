'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LifeBuoy, Send, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSupportPage() {
  const { isAuthenticated } = useAdminAuth()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [replyModal, setReplyModal] = useState<any>(null)
  const [reply, setReply] = useState('')
  const [replying, setReplying] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/api/v1/admin/support/tickets?status=ALL')
      setTickets(res.data.items || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { if (isAuthenticated) load() }, [isAuthenticated, load])

  const handleReply = async () => {
    if (!reply.trim()) return
    setReplying(true)
    try {
      await adminFetch(`/api/v1/admin/support/tickets/${replyModal.id}/reply`, {
        method: 'POST', body: JSON.stringify({ reply })
      })
      toast.success('Yanıt gönderildi!')
      setReplyModal(null); setReply('')
      load()
    } catch (e: any) { toast.error(e.message) }
    finally { setReplying(false) }
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-indigo-400" />
          Destek Talepleri
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Kullanıcı şikayet ve önerileri</p>
      </div>

      <div className="space-y-3">
        {loading ? <div className="p-8 text-center text-slate-500">Yükleniyor...</div> :
          tickets.length === 0 ? <div className="p-8 text-center text-slate-500">Talep yok</div> :
            tickets.map((t) => (
              <Card key={t.id} className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white">{t.subject}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{t.user?.fullName} · {t.category} · {new Date(t.createdAt).toLocaleString('tr-TR')}</p>
                    </div>
                    <Badge className={`flex-shrink-0 ${t.status === 'OPEN' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      {t.status === 'OPEN' ? 'Açık' : 'Çözüldü'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{t.message}</p>
                  {t.adminReply && <div className="p-2 bg-emerald-950/30 rounded text-xs text-emerald-300 mt-2">Yanıt: {t.adminReply}</div>}
                  {t.status === 'OPEN' && (
                    <Button size="sm" variant="outline" className="mt-2" onClick={() => { setReplyModal(t); setReply('') }}>
                      <Send className="w-3 h-3 mr-1" /> Yanıtla
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
        }
      </div>

      <Dialog open={!!replyModal} onOpenChange={(v) => !v && setReplyModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Yanıt Gönder</DialogTitle></DialogHeader>
          <Textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} placeholder="Yanıtınız..." />
          <Button onClick={handleReply} disabled={replying || !reply.trim()} className="bg-indigo-600 hover:bg-indigo-700">
            {replying ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Gönder
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
