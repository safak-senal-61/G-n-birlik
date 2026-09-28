'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  LifeBuoy, MessageSquare, AlertTriangle, Lightbulb, Bug,
  UserCog, Wallet, HelpCircle, Mail, Phone, MessageCircle,
  Globe, Send, Loader2, CheckCircle2, Clock, Trash2, ChevronLeft,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-store'

const CATEGORIES = [
  { value: 'COMPLAINT', label: 'Şikayet', icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
  { value: 'SUGGESTION', label: 'Öneri', icon: Lightbulb, color: 'text-amber-600 bg-amber-50' },
  { value: 'BUG', label: 'Hata Bildirimi', icon: Bug, color: 'text-orange-600 bg-orange-50' },
  { value: 'ACCOUNT', label: 'Hesap', icon: UserCog, color: 'text-blue-600 bg-blue-50' },
  { value: 'PAYMENT', label: 'Ödeme', icon: Wallet, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'OTHER', label: 'Diğer', icon: HelpCircle, color: 'text-gray-600 bg-gray-50' },
]

const FAQ = [
  { q: 'İş ilanlarına nasıl başvurabilirim?', a: 'Ana sayfadaki iş ilanına tıklayın, "Başvur" butonuna basın. İşveren onayladığında bildirim gelecektir.' },
  { q: 'QR ile işe nasıl başlarım?', a: 'İşvereniniz size QR kodu gösterecek. "Başvurularım" sayfasından "QR Tara" butonuna basıp kamerayı QR koda doğrultun.' },
  { q: 'Cüzdanıma nasıl para yüklerim?', a: 'Cüzdan sayfasından "Para Yatır" butonuna basın. IBAN bilgilerinizi girin, sistem banka hesabına EFT yapın, admin onayı sonrası bakiyenize yansır.' },
  { q: 'Kazandığım parayı nasıl çekerim?', a: 'Cüzdan sayfasından "Para Çek" butonuna basın. IBAN bilgilerinizi girin, 3-5 iş günü içinde hesabınıza gönderilir.' },
  { q: 'Bildirimleri nasıl kapatırım?', a: 'Bildirimler sayfasında ⚙️ ikonuna tıklayın. Her kategoriyi ayrı ayrı açıp kapatabilirsiniz.' },
  { q: 'E-posta adresimi nasıl doğrularım?', a: 'Profil sayfanızda e-posta adresinizin yanındaki "Doğrula" butonuna tıklayın. Kod e-postanıza gelir, girin ve doğrulayın.' },
]

export default function HelpScreen() {
  const { user } = useAuth()
  const [ticketOpen, setTicketOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Ticket form
  const [category, setCategory] = useState('COMPLAINT')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Delete form
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteFeedback, setDeleteFeedback] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/support/tickets', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      })
      const data = await res.json()
      if (data.success) setTickets(data.data.items || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadTickets() }, [loadTickets])

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !message.trim()) { toast.error('Konu ve mesaj gerekli'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/v1/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ category, subject, message }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Destek talebiniz oluşturuldu! 🎫')
        setTicketOpen(false)
        setSubject(''); setMessage('')
        loadTickets()
      } else { toast.error(data.error) }
    } catch (e: any) { toast.error(e.message) }
    finally { setSubmitting(false) }
  }

  const handleDeleteAccount = async () => {
    if (!deleteReason.trim()) { toast.error('Silme sebebi gerekli'); return }
    if (!confirm('Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/v1/auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ reason: deleteReason, feedback: deleteFeedback }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Hesap silme talebiniz alındı. Admin onayı sonrası hesabınız silinecektir.')
        setDeleteOpen(false)
        setDeleteReason(''); setDeleteFeedback('')
      } else { toast.error(data.error) }
    } catch (e: any) { toast.error(e.message) }
    finally { setDeleteLoading(false) }
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4 sm:mb-6">
        <LifeBuoy className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
        Yardım & Destek
      </h1>

      {/* İletişim Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <ContactCard icon={Mail} label="E-posta" value="destek@gunubirlik.com" href="mailto:destek@gunubirlik.com" color="bg-blue-50 text-blue-600" />
        <ContactCard icon={Phone} label="Telefon" value="0850 123 45 67" href="tel:08501234567" color="bg-emerald-50 text-emerald-600" />
        <ContactCard icon={MessageCircle} label="WhatsApp" value="Mesaj Gönder" href="https://wa.me/908501234567" color="bg-green-50 text-green-600" />
        <ContactCard icon={Globe} label="Web Sitesi" value="gunubirlik.com" href="https://gunubirlik.com" color="bg-purple-50 text-purple-600" />
      </div>

      {/* Destek Talebi Oluştur */}
      <Card className="mb-4">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900">Destek Talebi Oluştur</h3>
              <p className="text-xs text-gray-500 mt-0.5">Şikayet, öneri veya hata bildirin</p>
            </div>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 shrink-0" onClick={() => setTicketOpen(true)}>
              <Send className="w-3.5 h-3.5 mr-1" /> Yeni Talep
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Taleplerim */}
      <Card className="mb-4">
        <CardHeader className="pb-2 p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">Taleplerim</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">Yükleniyor...</div>
          ) : tickets.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">Henüz talep yok</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {tickets.map((t) => (
                <div key={t.id} className="p-3 flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{t.subject}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.category} · {new Date(t.createdAt).toLocaleDateString('tr-TR')}</p>
                    {t.adminReply && (
                      <div className="mt-1.5 p-2 bg-emerald-50 rounded text-xs text-emerald-700">
                        <strong>Yanıt:</strong> {t.adminReply}
                      </div>
                    )}
                  </div>
                  <Badge className={`text-[9px] flex-shrink-0 ${
                    t.status === 'OPEN' ? 'bg-amber-100 text-amber-700' :
                    t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {t.status === 'OPEN' ? 'Açık' : t.status === 'RESOLVED' ? 'Çözüldü' : t.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SSS */}
      <Card className="mb-4">
        <CardHeader className="pb-2 p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">Sık Sorulan Sorular</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-50">
            {FAQ.map((item, i) => (
              <details key={i} className="p-3 group">
                <summary className="text-sm font-medium text-gray-900 cursor-pointer flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                  {item.q}
                </summary>
                <p className="text-xs text-gray-600 mt-2 ml-6 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hesabı Sil */}
      <Card className="border-red-200">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-red-700 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> Hesabımı Sil
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Hesabınızı kalıcı olarak silmek için talep oluşturun</p>
            </div>
            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 shrink-0" onClick={() => setDeleteOpen(true)}>
              Sil
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ticket Dialog */}
      <Dialog open={ticketOpen} onOpenChange={setTicketOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Destek Talebi</DialogTitle>
            <DialogDescription>Şikayet, öneri veya hata bildirin</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Kategori</Label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {CATEGORIES.map((c) => (
                  <button key={c.value} onClick={() => setCategory(c.value)}
                    className={`p-2 rounded-lg text-[11px] font-medium border transition-all ${
                      category === c.value ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Konu</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Kısa başlık" className="h-10" />
            </div>
            <div>
              <Label className="text-xs">Mesaj</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Detaylı açıklama..." />
            </div>
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={handleSubmitTicket} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Gönder
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Hesabımı Sil
            </DialogTitle>
            <DialogDescription>
              Bu işlem geri alınamaz. Talebiniz admin tarafından onaylandıktan sonra hesabınız ve tüm verileriniz silinir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Silme Sebebi</Label>
              <Textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} rows={2} placeholder="Neden hesabınızı silmek istiyorsunuz?" />
            </div>
            <div>
              <Label className="text-xs">Geri Bildirim (opsiyonel)</Label>
              <Textarea value={deleteFeedback} onChange={(e) => setDeleteFeedback(e.target.value)} rows={2} placeholder="Bizi geliştirmek için önerileriniz..." />
            </div>
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleDeleteAccount} disabled={deleteLoading}>
              {deleteLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Silme Talebi Oluştur
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ContactCard({ icon: Icon, label, value, href, color }: { icon: any; label: string; value: string; href: string; color: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="flex flex-col items-center gap-1.5 p-2.5 sm:p-3 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all">
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-center">
        <p className="text-[10px] text-gray-500">{label}</p>
        <p className="text-[11px] sm:text-xs font-medium text-gray-700 truncate max-w-full">{value}</p>
      </div>
    </a>
  )
}
