'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Send, Loader2, Megaphone, Mail, Bell, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

const TEMPLATES = [
  { type: 'UPDATE', title: '🚀 Yeni Güncelleme!', msg: 'Uygulamamız güncellendi! Yeni özellikler keşfedin.', html: '<h1>🚀 Yeni Güncelleme!</h1><p>Uygulamamız yeni özelliklerle güncellendi.</p>' },
  { type: 'HOLIDAY', title: '🎉 Bayramınız Kutlu Olsun!', msg: 'Tüm kullanıcılarımızın bayramı kutlu olsun.', html: '<h1>🎉 Bayramınız Kutlu Olsun!</h1><p>Tüm kullanıcılarımızın bayramı mübarek olsun.</p>' },
  { type: 'MAINTENANCE', title: '🔧 Bakım Bildirimi', msg: 'Sistem bakımı yapılacaktır.', html: '<h1>🔧 Bakım Bildirimi</h1><p>Sistem bakımı yapılacaktır.</p>' },
  { type: 'PROMOTION', title: '🎁 Özel Fırsat!', msg: 'Sınırlı süreli özel fırsat!', html: '<h1>🎁 Özel Fırsat!</h1><p>Sınırlı süreli özel fırsatı kaçırmayın!</p>' },
]

export default function AdminBroadcastPage() {
  const { isAuthenticated } = useAdminAuth()
  const [broadcasts, setBroadcasts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '', message: '', htmlContent: '', type: 'ANNOUNCEMENT',
    target: 'ALL', sendEmail: true, sendPush: true,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminFetch('/api/v1/admin/broadcast')
      setBroadcasts(res.data.items || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { if (isAuthenticated) load() }, [isAuthenticated, load])

  const handleCreate = async () => {
    if (!form.title || !form.message) { toast.error('Başlık ve mesaj gerekli'); return }
    try {
      await adminFetch('/api/v1/admin/broadcast', { method: 'POST', body: JSON.stringify(form) })
      toast.success('Broadcast oluşturuldu!')
      setForm({ ...form, title: '', message: '', htmlContent: '' })
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  const handleSend = async (id: string) => {
    setSending(id)
    try {
      const res = await adminFetch(`/api/v1/admin/broadcast/${id}/send`, { method: 'POST' })
      toast.success(`Gönderildi! ${res.data.sentCount} kişiye ulaştı.`)
      load()
    } catch (e: any) { toast.error(e.message) }
    finally { setSending(null) }
  }

  const applyTemplate = (t: any) => {
    setForm({ ...form, title: t.title, message: t.msg, htmlContent: t.html, type: t.type })
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-indigo-400" />
          Broadcast — Toplu Bildirim
        </h1>
        <p className="text-slate-400 mt-1 text-sm">Mail + push bildirimi gönder (OneSignal)</p>
      </div>

      {/* Şablonlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {TEMPLATES.map((t) => (
          <button key={t.type} onClick={() => applyTemplate(t)}
            className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-left hover:border-indigo-500/40 transition-all">
            <p className="text-sm font-medium text-white">{t.title}</p>
            <p className="text-[11px] text-slate-500 mt-1">{t.msg.substring(0, 40)}...</p>
          </button>
        ))}
      </div>

      {/* Oluştur */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-slate-300 text-sm">Başlık</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Bildirim başlığı" className="bg-slate-950/60 border-slate-800 text-white" />
            </div>
            <div>
              <Label className="text-slate-300 text-sm">Tip</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="bg-slate-950/60 border-slate-800 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANNOUNCEMENT">Duyuru</SelectItem>
                  <SelectItem value="UPDATE">Güncelleme</SelectItem>
                  <SelectItem value="HOLIDAY">Bayram</SelectItem>
                  <SelectItem value="MAINTENANCE">Bakım</SelectItem>
                  <SelectItem value="PROMOTION">Promosyon</SelectItem>
                  <SelectItem value="CUSTOM">Özel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-slate-300 text-sm">Kısa Mesaj (push için)</Label>
            <Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Kısa bildirim mesajı" className="bg-slate-950/60 border-slate-800 text-white" />
          </div>
          <div>
            <Label className="text-slate-300 text-sm">HTML İçerik (mail için)</Label>
            <Textarea value={form.htmlContent} onChange={(e) => setForm({ ...form, htmlContent: e.target.value })}
              rows={5} placeholder="<h1>Başlık</h1><p>İçerik...</p>"
              className="bg-slate-950/60 border-slate-800 text-white font-mono text-xs" />
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-slate-300 text-sm">Hedef</Label>
              <Select value={form.target} onValueChange={(v) => setForm({ ...form, target: v })}>
                <SelectTrigger className="bg-slate-950/60 border-slate-800 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Kullanıcılar</SelectItem>
                  <SelectItem value="WORKERS">İş Arayanlar</SelectItem>
                  <SelectItem value="EMPLOYERS">İşverenler</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.sendPush} onChange={(e) => setForm({ ...form, sendPush: e.target.checked })} className="w-4 h-4" />
                <Bell className="w-4 h-4" /> Push
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input type="checkbox" checked={form.sendEmail} onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })} className="w-4 h-4" />
                <Mail className="w-4 h-4" /> Email
              </label>
            </div>
          </div>
          <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
            <Megaphone className="w-4 h-4 mr-2" /> Broadcast Oluştur
          </Button>
        </CardContent>
      </Card>

      {/* Geçmiş */}
      <Card className="bg-slate-900/60 border-slate-800">
        <CardContent className="p-0">
          {loading ? <div className="p-6 text-center text-slate-500">Yükleniyor...</div> : (
            <div className="divide-y divide-slate-800">
              {broadcasts.length === 0 ? <div className="p-6 text-center text-slate-500">Henüz broadcast yok</div> :
                broadcasts.map((b) => (
                  <div key={b.id} className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{b.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{b.type} · {b.target} · {new Date(b.createdAt).toLocaleString('tr-TR')}</p>
                      {b.sentCount > 0 && <p className="text-xs text-emerald-400 mt-1">{b.sentCount} kişiye gönderildi</p>}
                    </div>
                    {b.status === 'DRAFT' ? (
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shrink-0" onClick={() => handleSend(b.id)} disabled={sending === b.id}>
                        {sending === b.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                        Gönder
                      </Button>
                    ) : (
                      <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Gönderildi
                      </Badge>
                    )}
                  </div>
                ))
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
