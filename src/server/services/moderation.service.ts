/**
 * Moderasyon Servisi - Akıllı içerik filtreleme
 *
 * Yetenekler:
 *  - Küfür filtreleme (Türkçe + İngilizce, leetspeak & varyasyonlar)
 *  - Telefon numarası tespiti (TR formatları: +90 5xx, 0 5xx, 5xx, sabit hat)
 *  - E-posta adresi tespiti
 *  - URL / web sitesi tespiti (domain + IP + kısa link)
 *  - Sosyal medya handle tespiti (@username, instagram.com/, facebook.com/)
 *  - IBAN tespiti (TR99 ...)
 *  - Adres / konum ifadeleri (mahalle/cad/sokak + kelime)
 *  - Tekrarlayan spam tespiti (kısa sürede aynı içerik)
 *
 *  Yaptırım seviyeleri:
 *  - LOW (bilgi): phone, email, url, social, iban → sadece maskele + flag
 *  - MEDIUM: hafif küfür → maskele + flag + uyarı (3 flag'de 1 gün)
 *  - HIGH: ağır küfür → maskele + flag + 7 gün askıya alma
 *  - CRITICAL: tehdit, ırkçı → mesaj engelle + flag + 30 gün askıya alma
 *
 *  Otomatik yaptırım (escalation):
 *  - 5 LOW flag → 1 günlük askıya alma
 *  - 3 MEDIUM flag → 1 günlük askıya alma
 *  - 2 HIGH flag → 7 günlük askıya alma
 *  - 1 CRITICAL flag → 30 günlük askıya alma
 *  - Toplam 20 flag → kalıcı ban incelemesi
 */
import { db } from '@/lib/db'
import { safeJsonParse } from '@/server/lib/auth'

// ====================================================================
// Tipler
// ====================================================================

export type ViolationType =
  | 'PROFANITY'
  | 'PHONE'
  | 'EMAIL'
  | 'URL'
  | 'SOCIAL_HANDLE'
  | 'IBAN'
  | 'ADDRESS'
  | 'SPAM'
  | 'THREAT'
  | 'OTHER'

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface Violation {
  type: ViolationType
  severity: Severity
  matchedText: string // maskelenmiş
  startIndex: number
  endIndex: number
  ruleId?: string
}

export interface FilterResult {
  filteredContent: string
  violations: Violation[]
  hasViolations: boolean
  shouldBlock: boolean // true ise mesaj tamamen engellenmeli
  maxSeverity: Severity | null
}

export interface AutoAction {
  type: 'WARNING' | 'SUSPENSION' | 'BAN_REVIEW' | null
  durationHours?: number
  reason: string
  relatedViolations: Violation[]
}

// ====================================================================
// Türkçe Küfür Listesi (maskelenmiş halde)
// ====================================================================
// Not: Bunlar gerçek filtre için gereklidir. Yönetici panelinden düzenlenebilir.

const PROFANITY_HIGH = [
  // Ağır küfürler (HIGH severity) - burada gerçek kelimeler kullanılır
  'amk', 'aq', 'amına', 'amını', 'amcık', 'amck', 'aminoglu', 'pic', 'piç',
  'orospu', 'oruspu', 'pezevenk', 'yarrak', 'yarragi', 'yarrağım', 'yarragina',
  'sikim', 'siki', 'sikik', 'sikiş', 'sikerim', 'siktir', 'siktiğin',
  'göt', 'götün', 'götü', 'götveren', 'gotveren',
  'ananı', 'ananin', 'ananın', 'anani', 'avradini', 'avradını',
  'döl', 'dallos', 'dallama',
]

const PROFANITY_MEDIUM = [
  'salak', 'aptal', 'gerizekali', 'geri zekali', 'manyak', 'psikopat',
  'aptallar', 'aptallığı', 'mal', 'malla', 'aptallastirma',
  'ibne', 'lan', 'ulen', 'ulayn', 'aqdırma', 'pislik',
  'geri', 'öküz', 'eşek', 'ahmak',
]

const PROFANITY_EN = [
  'fuck', 'fck', 'f*ck', 'shit', 'sh1t', 'bitch', 'b1tch', 'asshole',
  'a$$hole', 'bastard', 'dick', 'd1ck', 'pussy', 'p*ssy', 'cunt',
  'motherfucker', 'mf', 'wtf', 'stfu',
]

const THREAT_KEYWORDS = [
  'öldüreceğim', 'öldür', 'bogazini', 'bogazını', 'doğrayacagim',
  'vuracagim', 'vuracağım', 'dovecegim', 'döveceğim', 'tecavuz',
  'tecavüz', 'bomba', 'patlatacagim', 'patlatacağım', 'reyon',
  'bıçaklayacagim', 'bicaklayacagim', 'bıçaklayacağım',
  'kidnap', 'kaçiracagim', 'kaçıracağım',
]

// ====================================================================
// Regex Desenleri
// ====================================================================

// Türk telefon: +90 5xx xxx xx xx, 0 5xx xxx xx xx, 05xx xxx xx xx, 5xx xxx xx xx, sabit hat 0 2xx xxx xx xx
const PHONE_REGEX =
  /(\+?90[\s\-]?)?0?5\d{2}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}|(\+?90[\s\-]?)?0?\d{3}[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/g

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

const URL_REGEX = /(?:(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g

const SOCIAL_HANDLE_REGEX =
  /(?:@|instagram\.com\/|facebook\.com\/|twitter\.com\/|x\.com\/|tiktok\.com\/|youtube\.com\/|t\.me\/|wa\.me\/|whatsapp\.com\/)[a-zA-Z0-9._-]+/gi

const IBAN_REGEX = /\bTR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}\b/g

// Adres ipuçları: "mah.", "mahalle", "cad.", "bulv.", "sok.", "no:", "apt."
const ADDRESS_REGEX =
  /\b(?:mah(?:alle|\.)?|cad(?:de|\.)?|bulv(?:ar|\.)?|sok(?:ak|\.)?|site|apt(?:\.|no)?|no\s*:\s*\d+|daire\s*:\s*\d+|kat\s*:\s*\d+)\b[^.!?\n]{0,80}/gi

// ====================================================================
// Leetspeak normalizasyonu (küfür tespiti için)
// ====================================================================

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/0/g, 'o')
    .replace(/1/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/9/g, 'g')
    .replace(/\$/g, 's')
    .replace(/@/g, 'a')
    .replace(/!/g, 'i')
    .replace(/\*/g, '')
    .replace(/\./g, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
}

// ====================================================================
// Maskeleme
// ====================================================================

function maskText(text: string, type: ViolationType): string {
  const maskMap: Record<ViolationType, string> = {
    PROFANITY: '***',
    PHONE: '[telefon]',
    EMAIL: '[e-posta]',
    URL: '[link]',
    SOCIAL_HANDLE: '[sosyal medya]',
    IBAN: '[IBAN]',
    ADDRESS: '[adres]',
    SPAM: '[spam]',
    THREAT: '[tehdit]',
    OTHER: '[redakte]',
  }
  return maskMap[type] || '[redakte]'
}

// ====================================================================
// Bir mesajı filtrele - ana fonksiyon
// ====================================================================

export async function filterMessageContent(
  content: string,
  options: { customRules?: any[] } = {}
): Promise<FilterResult> {
  const violations: Violation[] = []
  let filtered = content
  let shouldBlock = false
  const maxSev: Severity | null = null

  // 1. Tehdit tespiti (CRITICAL - block)
  const normalizedLower = normalize(content)
  for (const kw of THREAT_KEYWORDS) {
    const normKw = normalize(kw)
    const idx = normalizedLower.indexOf(normKw)
    if (idx !== -1) {
      // Orijinal içerikteki karşılığını bul
      violations.push({
        type: 'THREAT',
        severity: 'CRITICAL',
        matchedText: maskText(content, 'THREAT'),
        startIndex: idx,
        endIndex: idx + kw.length,
      })
      shouldBlock = true
    }
  }

  // 2. Ağır küfür (HIGH)
  // Türkçe-aware word boundary kullanır (İ, ı, ş, ğ, ü, ö, ç dahil)
  for (const word of PROFANITY_HIGH) {
    const re = buildProfanityRegex(word)
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
      violations.push({
        type: 'PROFANITY',
        severity: 'HIGH',
        matchedText: '***',
        startIndex: m.index,
        endIndex: m.index + m[0].length,
      })
    }
  }

  // 3. Orta seviye küfür (MEDIUM)
  for (const word of PROFANITY_MEDIUM) {
    const re = buildProfanityRegex(word)
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
      violations.push({
        type: 'PROFANITY',
        severity: 'MEDIUM',
        matchedText: '***',
        startIndex: m.index,
        endIndex: m.index + m[0].length,
      })
    }
  }

  // 4. İngilizce küfür (HIGH)
  for (const word of PROFANITY_EN) {
    const re = buildProfanityRegex(word)
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
      violations.push({
        type: 'PROFANITY',
        severity: 'HIGH',
        matchedText: '***',
        startIndex: m.index,
        endIndex: m.index + m[0].length,
      })
    }
  }

  // 5. Telefon numarası (LOW)
  let m: RegExpExecArray | null
  PHONE_REGEX.lastIndex = 0
  while ((m = PHONE_REGEX.exec(content)) !== null) {
    // En az 10 hane olmalı (gerçek numara)
    const digits = m[0].replace(/\D/g, '')
    if (digits.length >= 10) {
      violations.push({
        type: 'PHONE',
        severity: 'LOW',
        matchedText: '[telefon]',
        startIndex: m.index,
        endIndex: m.index + m[0].length,
      })
    }
  }

  // 6. E-posta (LOW)
  EMAIL_REGEX.lastIndex = 0
  while ((m = EMAIL_REGEX.exec(content)) !== null) {
    violations.push({
      type: 'EMAIL',
      severity: 'LOW',
      matchedText: '[e-posta]',
      startIndex: m.index,
      endIndex: m.index + m[0].length,
    })
  }

  // 7. URL / web sitesi (LOW)
  URL_REGEX.lastIndex = 0
  while ((m = URL_REGEX.exec(content)) !== null) {
    // E-posta değilse
    if (!m[0].includes('@')) {
      violations.push({
        type: 'URL',
        severity: 'LOW',
        matchedText: '[link]',
        startIndex: m.index,
        endIndex: m.index + m[0].length,
      })
    }
  }

  // 8. Sosyal medya handle (LOW)
  SOCIAL_HANDLE_REGEX.lastIndex = 0
  while ((m = SOCIAL_HANDLE_REGEX.exec(content)) !== null) {
    violations.push({
      type: 'SOCIAL_HANDLE',
      severity: 'LOW',
      matchedText: '[sosyal medya]',
      startIndex: m.index,
      endIndex: m.index + m[0].length,
    })
  }

  // 9. IBAN (LOW)
  IBAN_REGEX.lastIndex = 0
  while ((m = IBAN_REGEX.exec(content)) !== null) {
    violations.push({
      type: 'IBAN',
      severity: 'LOW',
      matchedText: '[IBAN]',
      startIndex: m.index,
      endIndex: m.index + m[0].length,
    })
  }

  // 10. Adres (LOW)
  ADDRESS_REGEX.lastIndex = 0
  while ((m = ADDRESS_REGEX.exec(content)) !== null) {
    violations.push({
      type: 'ADDRESS',
      severity: 'LOW',
      matchedText: '[adres]',
      startIndex: m.index,
      endIndex: m.index + m[0].length,
    })
  }

  // 11. Özel kurallar (DB'den)
  if (options.customRules && options.customRules.length > 0) {
    for (const rule of options.customRules) {
      if (!rule.isEnabled) continue
      try {
        const re = new RegExp(rule.pattern, 'gi')
        while ((m = re.exec(content)) !== null) {
          violations.push({
            type: rule.type as ViolationType,
            severity: rule.severity as Severity,
            matchedText: maskText(m[0], rule.type as ViolationType),
            startIndex: m.index,
            endIndex: m.index + m[0].length,
            ruleId: rule.id,
          })
          if (rule.action === 'BLOCK') shouldBlock = true
        }
      } catch {
        // Geçersiz regex, atla
      }
    }
  }

  // Maskeleme uygula - en sondan başa doğru (indeksleri bozmamak için)
  const sorted = [...violations].sort((a, b) => b.startIndex - a.startIndex)
  for (const v of sorted) {
    filtered =
      filtered.slice(0, v.startIndex) +
      maskText(content.slice(v.startIndex, v.endIndex), v.type) +
      filtered.slice(v.endIndex)
  }

  // Maksimum severity
  const severityOrder: Severity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
  const maxSeverity = violations.reduce<Severity | null>((max, v) => {
    if (!max) return v.severity
    return severityOrder.indexOf(v.severity) > severityOrder.indexOf(max)
      ? v.severity
      : max
  }, null)

  return {
    filteredContent: filtered,
    violations,
    hasViolations: violations.length > 0,
    shouldBlock,
    maxSeverity,
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ====================================================================
// Türkçe-aware kelime sınırı
// ====================================================================
// JavaScript'in \b ve \w metakarakterleri sadece ASCII [A-Za-z0-9_] tanır.
// Türkçe karakterler (İ, ı, ş, ğ, ü, ö, ç, Ş, Ğ, Ü, Ö, Ç) \w'ye dahil DEĞİL.
// Bu yüzden "İlanınız" (büyük İ) → \b"İ"|"lan"\b → "lan" kelimesi yanlış
// match ediliyordu. Çözüm: Unicode property escapes kullanarak tüm harfleri
// word char olarak kabul etmek.
//
// \p{L} = tüm Unicode harfler (Latin, Greek, Cyrillic, vs. dahil)
// \p{N} = tüm Unicode sayılar
//
// Yeni desen:
//   (?<![\p{L}\p{N}_])  → önceki karakter harf/sayı/_ değil (kelime başı)
//   <word>               → aranacak kelime
//   [\p{L}\p{N}_]*       → sonrasındaki harf/sayı/_ (ekler için)
//   (?![\p{L}\p{N}_])    → sonraki karakter harf/sayı/_ değil (kelime sonu)
//
// Not: 'u' (unicode) flag gereklidir.
const WORD_BOUNDARY_START = '(?<![\\p{L}\\p{N}_])'
const WORD_BOUNDARY_END = '(?![\\p{L}\\p{N}_])'
const WORD_CHARS = '[\\p{L}\\p{N}_]'

function buildProfanityRegex(word: string): RegExp {
  return new RegExp(
    `${WORD_BOUNDARY_START}${escapeRegex(word)}${WORD_CHARS}*${WORD_BOUNDARY_END}`,
    'giu'
  )
}

// ====================================================================
// Otomatik yaptırım hesaplama
// ====================================================================

export async function evaluateAutoAction(
  senderId: string,
  newViolations: Violation[]
): Promise<AutoAction> {
  if (newViolations.length === 0) {
    return { type: null, reason: '', relatedViolations: [] }
  }

  // Admin rolündeki kullanıcılar otomatik yaptırımdan muaftır (test ve inceleme için)
  const sender = await db.user.findUnique({
    where: { id: senderId },
    select: { role: true },
  })
  if (sender?.role === 'ADMIN') {
    return { type: null, reason: '', relatedViolations: [] }
  }

  // Son 30 günde kullanıcının flag sayılarını seviyeye göre al
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recentFlags = await db.moderationFlag.findMany({
    where: {
      senderId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { severity: true },
  })

  // Yeni ihlalleri seviyeye göre say
  const allViolations = [...recentFlags.map((f) => ({ severity: f.severity })), ...newViolations]
  const counts = {
    LOW: allViolations.filter((v) => v.severity === 'LOW').length,
    MEDIUM: allViolations.filter((v) => v.severity === 'MEDIUM').length,
    HIGH: allViolations.filter((v) => v.severity === 'HIGH').length,
    CRITICAL: allViolations.filter((v) => v.severity === 'CRITICAL').length,
  }
  const total = allViolations.length

  // CRITICAL: anında 30 gün askıya alma
  if (newViolations.some((v) => v.severity === 'CRITICAL')) {
    return {
      type: 'SUSPENSION',
      durationHours: 30 * 24,
      reason: 'Kritik seviye ihlal tespit edildi (tehdit/ağır saldırı). Otomatik 30 gün askıya alma.',
      relatedViolations: newViolations.filter((v) => v.severity === 'CRITICAL'),
    }
  }

  // 2 HIGH flag → 7 gün askıya alma
  if (counts.HIGH >= 2 && newViolations.some((v) => v.severity === 'HIGH')) {
    return {
      type: 'SUSPENSION',
      durationHours: 7 * 24,
      reason: '2 veya daha fazla yüksek seviye küfür/ihlal. Otomatik 7 gün askıya alma.',
      relatedViolations: newViolations.filter((v) => v.severity === 'HIGH'),
    }
  }

  // 3 MEDIUM flag → 1 gün askıya alma
  if (counts.MEDIUM >= 3 && newViolations.some((v) => v.severity === 'MEDIUM')) {
    return {
      type: 'SUSPENSION',
      durationHours: 24,
      reason: '3 veya daha fazla orta seviye ihlal. Otomatik 24 saat askıya alma.',
      relatedViolations: newViolations.filter((v) => v.severity === 'MEDIUM'),
    }
  }

  // 5 LOW flag → 1 gün askıya alma
  if (counts.LOW >= 5 && newViolations.some((v) => v.severity === 'LOW')) {
    return {
      type: 'SUSPENSION',
      durationHours: 24,
      reason: '5 veya daha fazla iletişim bilgisi paylaşımı. Otomatik 24 saat askıya alma.',
      relatedViolations: newViolations.filter((v) => v.severity === 'LOW'),
    }
  }

  // 20 toplam flag → kalıcı ban incelemesi
  if (total >= 20) {
    return {
      type: 'BAN_REVIEW',
      reason: '20+ toplam ihlal. Kalıcı ban incelemesi için yöneticiye yönlendirildi.',
      relatedViolations: newViolations,
    }
  }

  // Tek MEDIUM → uyarı
  if (newViolations.some((v) => v.severity === 'MEDIUM')) {
    return {
      type: 'WARNING',
      reason: 'Orta seviye ihlal nedeniyle uyarı gönderildi.',
      relatedViolations: newViolations.filter((v) => v.severity === 'MEDIUM'),
    }
  }

  // Tek HIGH → uyarı (sonraki HIGH askıya alacak)
  if (newViolations.some((v) => v.severity === 'HIGH')) {
    return {
      type: 'WARNING',
      reason: 'Yüksek seviye ihlal nedeniyle uyarı gönderildi. Bir kez daha tekrarlanırsa hesap askıya alınacaktır.',
      relatedViolations: newViolations.filter((v) => v.severity === 'HIGH'),
    }
  }

  return { type: null, reason: '', relatedViolations: [] }
}

// ====================================================================
// Kullanıcının askıda/banlı olup olmadığını kontrol et
// ====================================================================

export async function checkUserCanSend(userId: string): Promise<{
  allowed: boolean
  reason?: string
  suspension?: {
    type: 'TEMPORARY' | 'PERMANENT'
    until?: Date
    reason: string
  }
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      isSuspended: true,
      suspendedUntil: true,
      suspensionReason: true,
      isPermanentlyBanned: true,
      bannedReason: true,
    },
  })

  if (!user) {
    return { allowed: false, reason: 'Kullanıcı bulunamadı.' }
  }

  // Kalıcı ban
  if (user.isPermanentlyBanned) {
    return {
      allowed: false,
      reason: user.bannedReason || 'Hesabınız kalıcı olarak askıya alınmıştır.',
      suspension: { type: 'PERMANENT', reason: user.bannedReason || 'Kalıcı ban' },
    }
  }

  // Geçici askıya alma
  if (user.isSuspended) {
    // Süresi dolmuş mu? Otomatik çöz
    if (user.suspendedUntil && user.suspendedUntil < new Date()) {
      await db.user.update({
        where: { id: userId },
        data: {
          isSuspended: false,
          suspendedUntil: null,
          suspensionReason: null,
          suspendedAt: null,
          suspendedById: null,
        },
      })
      return { allowed: true }
    }

    return {
      allowed: false,
      reason: user.suspensionReason || 'Hesabınız geçici olarak askıya alınmıştır.',
      suspension: {
        type: 'TEMPORARY',
        until: user.suspendedUntil || undefined,
        reason: user.suspensionReason || 'Askıya alındı',
      },
    }
  }

  return { allowed: true }
}

// ====================================================================
// Sistem kurallarını seed et (ilk kurulumda)
// ====================================================================

export async function seedSystemRules() {
  const count = await db.moderationRule.count()
  if (count > 0) return

  const systemRules = [
    {
      name: 'Türkçe Telefon Numarası',
      description: 'TR telefon numaralarını tespit eder ve maskeler.',
      type: 'PHONE',
      pattern: '(\\+?90[\\s\\-]?)?0?5\\d{2}[\\s\\-]?\\d{3}[\\s\\-]?\\d{2}[\\s\\-]?\\d{2}',
      severity: 'LOW',
      action: 'FILTER',
      isSystem: true,
    },
    {
      name: 'E-posta Adresi',
      description: 'E-posta adreslerini tespit eder ve maskeler.',
      type: 'EMAIL',
      pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
      severity: 'LOW',
      action: 'FILTER',
      isSystem: true,
    },
    {
      name: 'Web Sitesi / URL',
      description: 'URL ve web adreslerini tespit eder ve maskeler.',
      type: 'URL',
      pattern: '(https?:\\/\\/)?(www\\.)?[a-zA-Z0-9-]+\\.[a-zA-Z]{2,}(\\/[^\\s]*)?',
      severity: 'LOW',
      action: 'FILTER',
      isSystem: true,
    },
    {
      name: 'Sosyal Medya Hesabı',
      description: 'Instagram, Facebook, Twitter, TikTok vb. sosyal medya hesaplarını maskeler.',
      type: 'SOCIAL_HANDLE',
      pattern: '(@|instagram\\.com\\/|facebook\\.com\\/|twitter\\.com\\/|x\\.com\\/|tiktok\\.com\\/|t\\.me\\/|wa\\.me\\/)[a-zA-Z0-9._-]+',
      severity: 'LOW',
      action: 'FILTER',
      isSystem: true,
    },
    {
      name: 'IBAN Numarası',
      description: 'TR IBAN numaralarını tespit eder ve maskeler.',
      type: 'IBAN',
      pattern: 'TR\\d{2}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{4}\\s?\\d{2}',
      severity: 'LOW',
      action: 'FILTER',
      isSystem: true,
    },
    {
      name: 'Adres İçeriği',
      description: 'Mahalle, cadde, sokak gibi adres ifadelerini maskeler.',
      type: 'ADDRESS',
      pattern: '(mahalle|mah\\.|cadde|cad\\.|bulvar|bulv\\.|sokak|sok\\.|site|apt)[^.!?\\n]{0,80}',
      severity: 'LOW',
      action: 'FILTER',
      isSystem: true,
    },
  ]

  for (const rule of systemRules) {
    await db.moderationRule.create({ data: rule })
  }
}

// ====================================================================
// Helper: violation tiplerini okunabilir etikete çevir
// ====================================================================

export function violationTypeLabel(type: ViolationType): string {
  const labels: Record<ViolationType, string> = {
    PROFANITY: 'Küfür/Hakaret',
    PHONE: 'Telefon Numarası',
    EMAIL: 'E-posta Adresi',
    URL: 'Web Sitesi/Link',
    SOCIAL_HANDLE: 'Sosyal Medya',
    IBAN: 'IBAN Numarası',
    ADDRESS: 'Adres Bilgisi',
    SPAM: 'Spam',
    THREAT: 'Tehdit',
    OTHER: 'Diğer',
  }
  return labels[type] || type
}

export function severityLabel(sev: Severity): string {
  const labels: Record<Severity, string> = {
    LOW: 'Düşük',
    MEDIUM: 'Orta',
    HIGH: 'Yüksek',
    CRITICAL: 'Kritik',
  }
  return labels[sev] || sev
}

export function severityColor(sev: Severity): string {
  const colors: Record<Severity, string> = {
    LOW: 'bg-blue-100 text-blue-700 border-blue-200',
    MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-700 border-red-200',
  }
  return colors[sev] || ''
}
