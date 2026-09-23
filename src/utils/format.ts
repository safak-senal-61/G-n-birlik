/**
 * Yardımcı fonksiyonlar - Formatlama, hesaplamalar
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

export function urgencyLabel(urgency: string): { text: string; color: string; bg: string } {
  switch (urgency) {
    case 'URGENT':
      return { text: 'Acil', color: '#dc2626', bg: '#fee2e2' }
    case 'HIGH':
      return { text: 'Yüksek Öncelik', color: '#ea580c', bg: '#ffedd5' }
    case 'NORMAL':
      return { text: 'Normal', color: '#059669', bg: '#d1fae5' }
    case 'LOW':
      return { text: 'Düşük', color: '#2563eb', bg: '#dbeafe' }
    default:
      return { text: urgency, color: '#6b7280', bg: '#f3f4f6' }
  }
}

export function statusLabel(status: string): { text: string; color: string; bg: string } {
  const map: Record<string, { text: string; color: string; bg: string }> = {
    PENDING: { text: 'Beklemede', color: '#ca8a04', bg: '#fef3c7' },
    ACCEPTED: { text: 'Onaylandı', color: '#16a34a', bg: '#dcfce7' },
    REJECTED: { text: 'Reddedildi', color: '#dc2626', bg: '#fee2e2' },
    WITHDRAWN: { text: 'Geri Çekildi', color: '#6b7280', bg: '#f3f4f6' },
    COMPLETED: { text: 'Tamamlandı', color: '#2563eb', bg: '#dbeafe' },
    NO_SHOW: { text: 'Gelmedi', color: '#dc2626', bg: '#fee2e2' },
    OPEN: { text: 'Açık', color: '#16a34a', bg: '#dcfce7' },
    FILLED: { text: 'Doldu', color: '#2563eb', bg: '#dbeafe' },
    CLOSED: { text: 'Kapandı', color: '#6b7280', bg: '#f3f4f6' },
    CANCELLED: { text: 'İptal', color: '#dc2626', bg: '#fee2e2' },
  }
  return map[status] || { text: status, color: '#6b7280', bg: '#f3f4f6' }
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

// Haversine mesafe
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
