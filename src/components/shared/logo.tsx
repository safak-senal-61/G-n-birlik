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
  variant = 'full',
  className = '',
  href,
  withBackground = true,
}: LogoProps) {
  if (variant === 'full') {
    const sizeMap = {
      sm: { h: 22, w: 88, pad: 'px-2 py-1' },
      md: { h: 28, w: 112, pad: 'px-2.5 py-1' },
      lg: { h: 36, w: 144, pad: 'px-3 py-1.5' },
      xl: { h: 46, w: 184, pad: 'px-3.5 py-2' },
    }
    const { h, w, pad } = sizeMap[size]

    const bgStyles = withBackground
      ? `bg-[#141615] dark:bg-[#181C1A] border border-[#2A2F2C] rounded-md ${pad}`
      : ''

    const content = (
      <div className={`inline-flex items-center shrink-0 select-none ${className}`}>
        <div className={`relative inline-flex items-center justify-center transition-opacity hover:opacity-90 ${bgStyles}`}>
          <Image
            src="/logo-wordmark.webp"
            alt="Günübirlik"
            width={w}
            height={h}
            className="h-auto object-contain"
            style={{ height: `${h}px`, width: 'auto' }}
          />
        </div>
      </div>
    )

    if (href) {
      return (
        <Link href={href} className="inline-flex shrink-0">
          {content}
        </Link>
      )
    }
    return content
  }

  const iconSizeMap = {
    sm: 28,
    md: 36,
    lg: 48,
    xl: 64,
  }
  const img = iconSizeMap[size]

  const content = (
    <div className={`inline-flex items-center gap-2 shrink-0 select-none ${className}`}>
      <Image
        src="/logo.webp"
        alt="Günübirlik"
        width={img}
        height={img}
        className="rounded-md object-contain"
      />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {content}
      </Link>
    )
  }

  return content
}
