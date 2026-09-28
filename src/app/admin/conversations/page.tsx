'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminAuth, adminFetch } from '@/lib/admin-store'
import {
  MessageSquare,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

export default function AdminConversationsPage() {
  const { isAuthenticated } = useAdminAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedConv, setSelectedConv] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      // Mevcut API'yi kullanarak tüm konuşmaları listele (admin için bir kullanıcı olarak)
      // Aslında admin'in tüm konuşmaları görebilmesi için özel bir endpoint gerekiyor
      // Şimdilik mevcut conversation listesini admin'in kendi hesabından çekelim
      // (gerçek ortamda /api/v1/admin/conversations eklenmeli)
      const res = await adminFetch('/api/v1/admin/conversations/list')
      setConversations(res.data?.items || [])
      setTotal(res.data?.pagination?.total || 0)
      setTotalPages(res.data?.pagination?.totalPages || 1)
    } catch {
      // Henüz eklenmedi - boş göster
      setConversations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated, page])

  // Eğer bir konuşma seçilmişse, mesajlarını göster
  if (selectedConv) {
    return <ConversationDetail conversationId={selectedConv} onBack={() => setSelectedConv(null)} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
          Sohbetler
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Tüm konuşmaları incele, filtrelenmiş ve orijinal mesajları gör
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Konuşma ID ara... (yakında: kullanıcı adı, e-posta)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium mb-2">Tüm Sohbetleri Görüntüle</p>
        <p className="text-xs mb-4">
          Belirli bir kullanıcının konuşmalarını görmek için kullanıcı detay sayfasından ilerleyin
          veya aşağıdaki aramayı kullanın.
        </p>
        {search && (
          <button
            onClick={() => setSelectedConv(search.trim())}
            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-sm font-medium transition-colors"
          >
            "{search}" ID'li sohbeti aç
          </button>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <MessageSquare className="w-8 h-8 text-indigo-400 mb-2" />
          <p className="font-medium text-white text-sm">İhlal Kuyruğu</p>
          <p className="text-xs text-slate-500 mt-1 mb-3">Filtrelenen mesajları buradan inceleyin</p>
          <button
            onClick={() => router.push('/admin/flags')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            İhlal kuyruğuna git →
          </button>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <Search className="w-8 h-8 text-emerald-400 mb-2" />
          <p className="font-medium text-white text-sm">Kullanıcı Ara</p>
          <p className="text-xs text-slate-500 mt-1 mb-3">Kullanıcı detayından konuşmalarına erişin</p>
          <button
            onClick={() => router.push('/admin/users')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Kullanıcılara git →
          </button>
        </div>
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <AlertTriangle className="w-8 h-2 text-amber-400 mb-2" />
          <p className="font-medium text-white text-sm">Yaptırım Geçmişi</p>
          <p className="text-xs text-slate-500 mt-1 mb-3">Tüm askıya alma ve banlama kayıtları</p>
          <button
            onClick={() => router.push('/admin/audit')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium"
          >
            İşlem günlüğüne git →
          </button>
        </div>
      </div>
    </div>
  )
}

function ConversationDetail({ conversationId, onBack }: { conversationId: string; onBack: () => void }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await adminFetch(`/api/v1/admin/conversations/${conversationId}/messages`)
        setData(res.data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [conversationId])

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Sohbetler
      </button>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-slate-900/60 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6 bg-red-950/40 border border-red-800/50 rounded-xl text-red-200 text-sm">
          Hata: {error}
        </div>
      ) : data ? (
        <>
          {/* Konuşma bilgisi */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <h2 className="font-semibold text-white">Konuşma: {conversationId.slice(-8)}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
              {data.conversation?.job && (
                <span>İş: {data.conversation.job.title}</span>
              )}
              <span>·</span>
              <span>Katılımcılar: {data.conversation?.participants?.length || 0}</span>
            </div>
          </div>

          {/* Mesajlar */}
          <div className="space-y-3">
            {data.items.map((msg: any) => (
              <div
                key={msg.id}
                className={`bg-slate-900/60 border rounded-2xl p-4 ${
                  msg.isFiltered ? 'border-amber-800/50' : msg.isAutoBlocked ? 'border-red-800/50' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-medium text-white">{msg.sender?.fullName || 'Bilinmeyen'}</p>
                    <p className="text-xs text-slate-500">{new Date(msg.createdAt).toLocaleString('tr-TR')}</p>
                  </div>
                  <div className="flex gap-2">
                    {msg.isAutoBlocked && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-950/50 text-red-300 border border-red-800/50">
                        Engellendi
                      </span>
                    )}
                    {msg.isFiltered && !msg.isAutoBlocked && (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-950/50 text-amber-300 border border-amber-800/50 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Filtrelendi
                      </span>
                    )}
                    {!msg.isFiltered && !msg.isAutoBlocked && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                </div>
                <div className="text-sm text-slate-200 mb-1">
                  <span className="text-xs text-slate-500">Görünen: </span>
                  {msg.content}
                </div>
                {msg.originalContent && (
                  <div className="text-sm text-amber-200 mt-2 p-2 bg-amber-950/20 border border-amber-900/40 rounded-lg">
                    <span className="text-xs text-amber-400">Orijinal: </span>
                    {msg.originalContent}
                  </div>
                )}
                {msg.filterReasons && msg.filterReasons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {msg.filterReasons.map((r: any, i: number) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {r.type} · {r.severity}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}
