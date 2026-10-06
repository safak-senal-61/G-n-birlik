'use client'

import React from 'react'
import { Check, CheckCircle2, Building2, Wifi, ShieldCheck } from 'lucide-react'

export interface BankInfo {
  id: string
  name: string
  shortName: string
  cardGradient: string
  accentColor: string
  badgeBg: string
  logo: React.ReactNode
}

// Türkiye'deki en popüler bankaların listesi ve özel vektör logoları
export const TURKISH_BANKS: BankInfo[] = [
  {
    id: 'ziraat',
    name: 'Ziraat Bankası',
    shortName: 'Ziraat',
    cardGradient: 'from-red-600 via-rose-700 to-red-950',
    accentColor: '#e11922',
    badgeBg: 'bg-red-500/20 text-red-100 border-red-400/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#E11922" />
        <path
          d="M20 7C20 7 20 18 20 22M20 22C17 19 13 18 10 19C12 22 15 23 20 23M20 22C23 19 27 18 30 19C28 22 25 23 20 23M20 26C17 23 13 23 11 25C13 27 16 28 20 27M20 26C23 23 27 23 29 25C27 27 24 28 20 27M20 30C18 28 14 28 12 30C14 32 17 32 20 31M20 30C22 28 26 28 28 30C26 32 23 32 20 31M20 31V34"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'isbank',
    name: 'Türkiye İş Bankası',
    shortName: 'İş Bankası',
    cardGradient: 'from-blue-700 via-indigo-800 to-slate-950',
    accentColor: '#0a3a82',
    badgeBg: 'bg-blue-500/20 text-blue-100 border-blue-400/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#0A3A82" />
        <circle cx="20" cy="12" r="3" fill="white" />
        <rect x="18" y="18" width="4" height="14" rx="2" fill="white" />
        <path d="M12 20H28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 25H26" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'garanti',
    name: 'Garanti BBVA',
    shortName: 'Garanti BBVA',
    cardGradient: 'from-emerald-600 via-teal-700 to-slate-900',
    accentColor: '#008542',
    badgeBg: 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#008542" />
        {/* Yonca motifi */}
        <circle cx="16" cy="16" r="4.5" fill="white" />
        <circle cx="24" cy="16" r="4.5" fill="white" />
        <circle cx="16" cy="24" r="4.5" fill="white" />
        <circle cx="24" cy="24" r="4.5" fill="white" />
        <path d="M20 20L20 31" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'yapikredi',
    name: 'Yapı Kredi',
    shortName: 'Yapı Kredi',
    cardGradient: 'from-sky-700 via-blue-800 to-indigo-950',
    accentColor: '#003399',
    badgeBg: 'bg-sky-500/20 text-sky-100 border-sky-400/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#003399" />
        <path
          d="M11 25C11 17 15 13 20 13C25 13 29 17 29 25M14 24C16 19 18 16 20 16C22 16 24 19 26 24M20 16V28"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'akbank',
    name: 'Akbank',
    shortName: 'Akbank',
    cardGradient: 'from-rose-600 via-red-700 to-neutral-950',
    accentColor: '#e30613',
    badgeBg: 'bg-red-500/20 text-red-100 border-red-400/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#E30613" />
        <text
          x="20"
          y="25"
          fill="white"
          fontSize="15"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="0.5"
        >
          AK
        </text>
      </svg>
    ),
  },
  {
    id: 'qnb',
    name: 'QNB Finansbank',
    shortName: 'QNB',
    cardGradient: 'from-purple-800 via-fuchsia-950 to-neutral-950',
    accentColor: '#630040',
    badgeBg: 'bg-purple-500/20 text-purple-100 border-purple-400/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#630040" />
        <circle cx="20" cy="20" r="9" stroke="white" strokeWidth="2.5" />
        <path d="M25 25L30 30" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'vakifbank',
    name: 'VakıfBank',
    shortName: 'VakıfBank',
    cardGradient: 'from-amber-600 via-yellow-700 to-stone-900',
    accentColor: '#ffbe00',
    badgeBg: 'bg-amber-500/20 text-amber-100 border-amber-400/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#FFBE00" />
        <path
          d="M12 14L20 28L28 14"
          stroke="#1C1917"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 14L20 22L24 14"
          stroke="#1C1917"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: 'halkbank',
    name: 'Halkbank',
    shortName: 'Halkbank',
    cardGradient: 'from-blue-600 via-cyan-800 to-slate-900',
    accentColor: '#005baa',
    badgeBg: 'bg-blue-500/20 text-blue-100 border-blue-400/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#005BAA" />
        <rect x="12" y="12" width="4" height="16" rx="1" fill="white" />
        <rect x="24" y="12" width="4" height="16" rx="1" fill="white" />
        <rect x="12" y="18" width="16" height="4" rx="1" fill="white" />
      </svg>
    ),
  },
  {
    id: 'enpara',
    name: 'Enpara.com',
    shortName: 'Enpara',
    cardGradient: 'from-purple-600 via-violet-700 to-slate-950',
    accentColor: '#6a2875',
    badgeBg: 'bg-purple-500/20 text-purple-100 border-purple-400/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#6A2875" />
        <text
          x="18"
          y="27"
          fill="white"
          fontSize="22"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
        >
          e:
        </text>
      </svg>
    ),
  },
  {
    id: 'papara',
    name: 'Papara',
    shortName: 'Papara',
    cardGradient: 'from-zinc-800 via-neutral-900 to-black',
    accentColor: '#111111',
    badgeBg: 'bg-zinc-700/30 text-zinc-100 border-zinc-600/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#18181B" />
        <path
          d="M15 12H23C26 12 28 14 28 17C28 20 26 22 23 22H19V28H15V12ZM19 16V18H23C23.6 18 24 17.6 24 17C24 16.4 23.6 16 23 16H19Z"
          fill="white"
        />
      </svg>
    ),
  },
  {
    id: 'denizbank',
    name: 'DenizBank',
    shortName: 'DenizBank',
    cardGradient: 'from-sky-600 via-blue-800 to-slate-900',
    accentColor: '#0072ce',
    badgeBg: 'bg-sky-500/20 text-sky-100 border-sky-400/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#0072CE" />
        <path d="M12 28C15 28 26 28 29 28C28 31 13 31 12 28Z" fill="white" />
        <path d="M18 12V25L13 25L18 12Z" fill="white" />
        <path d="M20 9V25L28 25L20 9Z" fill="white" />
      </svg>
    ),
  },
  {
    id: 'teb',
    name: 'TEB (Türk Ekonomi Bankası)',
    shortName: 'TEB',
    cardGradient: 'from-emerald-700 via-teal-900 to-neutral-950',
    accentColor: '#008853',
    badgeBg: 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30',
    logo: (
      <svg viewBox="0 0 40 40" className="w-6 h-6 shrink-0" fill="none">
        <rect width="40" height="40" rx="8" fill="#008853" />
        <path
          d="M13 14H27M20 14V27"
          stroke="white"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: 'other',
    name: 'Diğer Banka',
    shortName: 'Diğer',
    cardGradient: 'from-slate-700 via-gray-800 to-stone-900',
    accentColor: '#475569',
    badgeBg: 'bg-slate-500/20 text-slate-100 border-slate-400/30',
    logo: (
      <div className="w-6 h-6 rounded-md bg-slate-600 flex items-center justify-center text-white shrink-0">
        <Building2 className="w-4 h-4" />
      </div>
    ),
  },
]

// ============================================================================
// IBAN FORMAT VE DOĞRULAMA YARDIMCILARI
// ============================================================================

/**
 * Kullanıcı girdisinden yalnızca 24 haneli rakamları temizler
 * Eğer kullanıcı 'TR' ile yapıştırdıysa başındaki TR'yi ve boşlukları atar
 */
export function cleanIbanDigits(raw: string): string {
  if (!raw) return ''
  return raw
    .toUpperCase()
    .replace(/^TR/i, '')
    .replace(/[^0-9]/g, '')
    .slice(0, 24)
}

/**
 * 24 haneli rakamları Türkiye standart IBAN formatında gruplar:
 * ## #### #### #### #### #### ##
 */
export function formatIbanDigitsDisplay(digits: string): string {
  if (!digits) return ''
  const parts: string[] = []
  if (digits.length > 0) parts.push(digits.slice(0, 2))
  if (digits.length > 2) parts.push(digits.slice(2, 6))
  if (digits.length > 6) parts.push(digits.slice(6, 10))
  if (digits.length > 10) parts.push(digits.slice(10, 14))
  if (digits.length > 14) parts.push(digits.slice(14, 18))
  if (digits.length > 18) parts.push(digits.slice(18, 22))
  if (digits.length > 22) parts.push(digits.slice(22, 24))
  return parts.join(' ')
}

/**
 * Kart üzerinde şık şekilde doldurulan 24 hane (kalanlar nokta ile maskeli)
 */
export function getMaskedCardIban(digits: string): string {
  const padded = digits.padEnd(24, '•')
  return formatIbanDigitsDisplay(padded)
}

// ============================================================================
// ULTRA MODERN BANKA KARTI ÖNİZLEME BİLEŞENİ
// ============================================================================

interface ModernBankCardProps {
  cardType?: 'DEPOSIT' | 'WITHDRAW'
  amount: string | number
  name: string
  ibanDigits: string
  selectedBank: BankInfo | null
  customBankName?: string
}

export function ModernBankCard({
  cardType = 'DEPOSIT',
  amount,
  name,
  ibanDigits,
  selectedBank,
  customBankName,
}: ModernBankCardProps) {
  const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount) || 0
  const isDeposit = cardType === 'DEPOSIT'

  // Banka seçildiyse onun gradient'ini, seçilmediyse tema gradient'ini kullan
  const gradient = selectedBank
    ? selectedBank.cardGradient
    : isDeposit
    ? 'from-emerald-600 via-teal-700 to-slate-950'
    : 'from-blue-700 via-indigo-800 to-slate-950'

  const bankDisplayName =
    selectedBank?.id === 'other'
      ? customBankName || 'Diğer Banka'
      : selectedBank?.shortName || (isDeposit ? 'Günübirlik Bakiye' : 'Çekim Hesabı')

  return (
    <div className="relative w-full aspect-[1.586/1] max-w-sm mx-auto rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white shadow-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01] select-none bg-gradient-to-br border border-white/20">
      {/* Arka plan akışkan degradeler */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} -z-10`} />

      {/* Parlak cam yansıması (Glass Sheen Highlight) */}
      <div className="pointer-events-none absolute -inset-full bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-12 -z-0" />
      <div className="pointer-events-none absolute top-0 right-0 w-44 h-44 rounded-full bg-white/10 blur-3xl -z-0" />
      <div className="pointer-events-none absolute bottom-0 left-0 w-36 h-36 rounded-full bg-black/20 blur-2xl -z-0" />

      {/* Üst Kısım: Tür Etiketi + Banka Logosu + Temassız İkon */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-1.5 bg-black/25 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/15">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-[10px] font-semibold tracking-wider uppercase text-white/90">
            {isDeposit ? 'Bakiye Yükleme' : 'Para Çekme'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {selectedBank && (
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20">
              <div className="w-4 h-4 flex items-center justify-center scale-90">
                {selectedBank.logo}
              </div>
              <span className="text-[11px] font-bold tracking-tight text-white truncate max-w-[110px]">
                {bankDisplayName}
              </span>
            </div>
          )}
          <Wifi className="w-4 h-4 text-white/70 rotate-90" />
        </div>
      </div>

      {/* Orta Kısım: Gerçekçi EMV Altın Çip + Tutar */}
      <div className="mt-3 sm:mt-4 flex items-center justify-between relative z-10">
        {/* Altın Çip */}
        <div className="w-10 h-7 sm:w-11 sm:h-8 rounded-md bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-500 border border-amber-600/40 shadow-inner relative overflow-hidden flex items-center justify-center">
          <div className="w-full h-px bg-amber-700/30 absolute" />
          <div className="h-full w-px bg-amber-700/30 absolute" />
          <div className="w-5 h-4 rounded-sm border border-amber-700/40" />
        </div>

        {/* Tutar Gösterimi */}
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-white/70 font-medium">
            {isDeposit ? 'Yüklenecek Tutar' : 'Çekilecek Tutar'}
          </p>
          <div className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
            {numericAmount > 0
              ? `${numericAmount.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺`
              : '0 ₺'}
          </div>
        </div>
      </div>

      {/* Alt Kısım: TR Sabit Formatlı IBAN + İsim + TROY Logosu */}
      <div className="mt-auto pt-3 sm:pt-4 relative z-10">
        <div className="mb-2">
          <div className="text-[9px] uppercase tracking-wider text-white/60 font-medium flex items-center justify-between">
            <span>Hesap IBAN (TR Sabit)</span>
            <span className="font-mono text-[9px] text-white/80">
              {ibanDigits.length}/24 hane
            </span>
          </div>
          <div className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-white drop-shadow-xs flex items-center gap-1.5 mt-0.5">
            <span className="text-emerald-300 font-bold bg-white/20 px-1 py-0.5 rounded text-[11px] sm:text-xs">
              TR
            </span>
            <span className="truncate">
              {ibanDigits.length > 0
                ? getMaskedCardIban(ibanDigits)
                : '•• •••• •••• •••• •••• •••• ••'}
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between pt-1 border-t border-white/15">
          <div className="min-w-0 pr-2">
            <p className="text-[8px] uppercase tracking-wider text-white/60">Hesap Sahibi</p>
            <p className="text-xs font-bold text-white uppercase truncate tracking-wide">
              {name.trim() || 'AD SOYAD'}
            </p>
          </div>

          {/* TROY Ulusal Ödeme Ağı Rozeti */}
          <div className="flex items-center gap-1 bg-white/90 text-slate-900 px-2 py-0.5 rounded font-black text-[10px] tracking-tighter shadow-xs shrink-0">
            <span className="text-red-600 text-xs">🇹🇷</span>
            <span>TROY</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// BANKA SEÇİCİ BİLEŞENİ (LOGOLU VE TİKLİ)
// ============================================================================

interface BankSelectorProps {
  selectedBankId: string
  onSelectBank: (bank: BankInfo) => void
  customBankName: string
  onCustomBankNameChange: (val: string) => void
}

export function BankSelector({
  selectedBankId,
  onSelectBank,
  customBankName,
  onCustomBankNameChange,
}: BankSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />
          Banka Seçiniz *
        </label>
        <span className="text-[11px] text-gray-400 dark:text-slate-400">Logoya tıklayıp seçin</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-gray-200 dark:border-white/10 rounded-xl bg-gray-50/50 dark:bg-slate-800/60">
        {TURKISH_BANKS.map((b) => {
          const isSelected = selectedBankId === b.id
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBank(b)}
              className={`relative flex items-center gap-2 p-2 rounded-lg text-left transition-all duration-150 border text-xs font-medium ${
                isSelected
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-xs ring-2 ring-emerald-500/20 font-bold'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-white/20'
              }`}
            >
              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                {b.logo}
              </div>
              <span className="truncate flex-1 text-[11px] sm:text-xs">
                {b.shortName}
              </span>

              {/* Seçili Tik Simgesi */}
              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Diğer Banka seçildiğinde özel isim girme alanı */}
      {selectedBankId === 'other' && (
        <div className="mt-2 animate-in fade-in duration-200">
          <input
            type="text"
            placeholder="Lütfen bankanızın adını yazın..."
            value={customBankName}
            onChange={(e) => onCustomBankNameChange(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg border border-gray-300 dark:border-white/10 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500"
          />
        </div>
      )}
    </div>
  )
}

// ============================================================================
// TR SABİT IBAN GİRİŞ ALANI BİLEŞENİ
// ============================================================================

interface FixedTrIbanInputProps {
  digits: string
  onChangeDigits: (digits: string) => void
  label?: string
  placeholder?: string
}

export function FixedTrIbanInput({
  digits,
  onChangeDigits,
  label = 'IBAN (24 Hane)',
  placeholder = '99 0001 2345 6789 0123 4567 89',
}: FixedTrIbanInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const cleaned = cleanIbanDigits(raw)
    onChangeDigits(cleaned)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    const cleaned = cleanIbanDigits(pasted)
    onChangeDigits(cleaned)
  }

  const isComplete = digits.length === 24
  const remaining = 24 - digits.length

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">{label} *</label>
        <div className="text-[11px] font-mono">
          {isComplete ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              24/24 Tamamlandı
            </span>
          ) : (
            <span className="text-gray-400 dark:text-slate-400">
              Kalan: <strong className="text-gray-700 dark:text-slate-200">{remaining}</strong> hane
            </span>
          )}
        </div>
      </div>

      {/* Sabit TR Prefix'li Input */}
      <div className="relative flex rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-slate-800 overflow-hidden shadow-xs focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition">
        {/* Sabit TR Rozeti */}
        <div className="flex items-center gap-1 px-3 bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-slate-200 font-mono font-bold text-sm border-r border-gray-300 dark:border-white/10 select-none shrink-0">
          <span className="text-xs">🇹🇷</span>
          <span>TR</span>
        </div>

        {/* 24 Hane Rakam Girişi (Otomatik Gruplanmış) */}
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={formatIbanDigitsDisplay(digits)}
          onChange={handleChange}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 text-sm font-mono tracking-wider text-gray-900 dark:text-white bg-transparent focus:outline-hidden placeholder:text-gray-300 dark:placeholder:text-slate-500"
        />

        {isComplete && (
          <div className="flex items-center pr-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        )}
      </div>

      <p className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center justify-between">
        <span>Başında &apos;TR&apos; sabittir, yalnızca 24 haneli rakamları giriniz.</span>
        <span className="text-[10px] text-gray-400 dark:text-slate-500">Toplam 26 karakter</span>
      </p>
    </div>
  )
}
