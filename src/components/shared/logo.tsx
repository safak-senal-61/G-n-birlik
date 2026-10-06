import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  variant?: 'full' | 'icon'
  className?: string
  href?: string
  withBackground?: boolean
}

export default function Logo({
  size = 'md',
  showText = true,
  variant = 'full',
  className = '',
  href,
  withBackground = true,
}: LogoProps) {
  // Variant full: Tek parça şeffaf wordmark görseli (G + ünübirlik)
  if (variant === 'full') {
    const fullHeightMap = {
      sm: { h: 26, w: 104, pad: 'px-2 py-0.5' },
      md: { h: 32, w: 128, pad: 'px-2.5 py-1' },
      lg: { h: 42, w: 168, pad: 'px-3 py-1.5' },
      xl: { h: 54, w: 215, pad: 'px-4 py-2' },
    }
    const { h, w, pad } = fullHeightMap[size]

    const bgStyles = withBackground
      ? `bg-slate-950/90 dark:bg-slate-950/80 border border-slate-800/90 dark:border-white/15 shadow-xs backdrop-blur-xs rounded-xl ${pad}`
      : ''

    const content = (
      <div className={`inline-flex items-center group select-none ${className}`}>
        <div className={`relative inline-flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95 group-hover:border-indigo-500/50 ${bgStyles}`}>
          <Image
            src="/logo-wordmark.webp"
            alt="Günübirlik"
            width={w}
            height={h}
            priority
            className="h-auto object-contain drop-shadow-[0_2px_8px_rgba(99,102,241,0.4)]"
            style={{ height: `${h}px`, width: 'auto' }}
          />
        </div>
      </div>
    )

    if (href) {
      return <Link href={href} className="inline-flex">{content}</Link>
    }
    return content
  }

  // Variant icon: Sadece kare G ikonu (ve opsiyonel yan metin)
  const sizeMap = {
    sm: { img: 32, text: 'text-base', sub: 'text-[9px]' },
    md: { img: 40, text: 'text-lg', sub: 'text-[10px]' },
    lg: { img: 56, text: 'text-2xl', sub: 'text-xs' },
    xl: { img: 76, text: 'text-3xl', sub: 'text-sm' },
  }

  const { img, text, sub } = sizeMap[size]

  const content = (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      <div className="relative flex-shrink-0 transition-transform duration-200 group-hover:scale-105 active:scale-95">
        <Image
          src="/logo.webp"
          alt="Günübirlik Logo"
          width={img}
          height={img}
          priority
          className="rounded-xl object-contain drop-shadow-[0_4px_16px_rgba(99,102,241,0.45)] ring-1 ring-slate-900/10 dark:ring-white/20"
        />
      </div>
      {showText && (
        <div className="flex flex-col min-w-0 leading-tight">
          <span className={`font-black tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400 bg-clip-text text-transparent ${text}`}>
            Günübirlik
          </span>
          <span className={`text-muted-foreground font-semibold tracking-wider uppercase -mt-0.5 ${sub}`}>
            İş Bul
          </span>
        </div>
      )}
    </div>
  )

  if (href) {
    return <Link href={href} className="inline-flex">{content}</Link>
  }

  return content
}
