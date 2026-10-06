/**
 * Yardımcı fonksiyonlar - Frontend için
 */
export function formatCurrency(amount: number, currency = 'TRY'): string {
  const symbols: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€' }
  const symbol = symbols[currency] || currency
  return `${symbol}${amount.toLocaleString('tr-TR')}`
}

export function formatWage(amount: number, type: string, currency = 'TRY'): string {
  const formatted = formatCurrency(amount, currency)
  switch (type) {
    case 'HOURLY': return `${formatted}/saat`
    case 'DAILY': return `${formatted}/gün`
    case 'FIXED': return formatted
    default: return formatted
  }
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export function formatRelative(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000

  if (diff < 60) return 'az önce'
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`
  return formatDate(d)
}

export function daysUntil(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  const diff = (d.getTime() - now.getTime()) / 86400000

  if (diff < 0) return 'Geçmiş'
  if (diff === 0) return 'Bugün'
  if (diff === 1) return 'Yarın'
  if (diff < 7) return `${diff} gün sonra`
  return formatDate(d)
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    INSAAT: 'İnşaat & Yapı',
    RESTAURANT: 'Restoran',
    TEMIZLIK: 'Temizlik',
    NAKLIYE: 'Nakliyat',
    TARIM: 'Tarım',
    TEKNIK: 'Teknik',
    SAGLIK: 'Sağlık',
    DIGER: 'Diğer',
  }
  return labels[category] || category
}

export function categoryIcon(category: string): string {
  const icons: Record<string, string> = {
    INSAAT: '🔨',
    RESTAURANT: '🍽️',
    TEMIZLIK: '✨',
    NAKLIYE: '🚚',
    TARIM: '🌾',
    TEKNIK: '🔧',
    SAGLIK: '❤️',
    DIGER: '💼',
  }
  return icons[category] || '💼'
}

export function urgencyLabel(urgency: string): { text: string; color: string } {
  switch (urgency) {
    case 'URGENT':
      return { text: 'Acil', color: 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700/60' }
    case 'HIGH':
      return { text: 'Yüksek Öncelik', color: 'bg-orange-100 dark:bg-orange-950/70 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700/60' }
    case 'NORMAL':
      return { text: 'Normal', color: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60' }
    case 'LOW':
      return { text: 'Düşük', color: 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700/60' }
    default:
      return { text: urgency, color: 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700' }
  }
}

export function statusLabel(status: string): { text: string; color: string } {
  const map: Record<string, { text: string; color: string }> = {
    PENDING: { text: 'Beklemede', color: 'bg-yellow-100 dark:bg-yellow-950/70 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700/60' },
    ACCEPTED: { text: 'Onaylandı', color: 'bg-green-100 dark:bg-emerald-950/70 text-green-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60' },
    REJECTED: { text: 'Reddedildi', color: 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700/60' },
    WITHDRAWN: { text: 'Geri Çekildi', color: 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 border-gray-300 dark:border-slate-700' },
    IN_PROGRESS: { text: 'İşe Başladı', color: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700/60' },
    COMPLETED: { text: 'Tamamlandı', color: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700/60' },
    NO_SHOW: { text: 'Gelmedi', color: 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700/60' },
    OPEN: { text: 'Açık', color: 'bg-green-100 dark:bg-emerald-950/70 text-green-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60' },
    FILLED: { text: 'Doldu', color: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700/60' },
    CLOSED: { text: 'Kapandı', color: 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300 border-gray-300 dark:border-slate-700' },
    CANCELLED: { text: 'İptal Edildi', color: 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700/60' },
  }
  return map[status] || { text: status, color: 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-300' }
}

export function initials(name?: string): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
