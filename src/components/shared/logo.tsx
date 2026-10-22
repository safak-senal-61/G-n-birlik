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
}: LogoProps) {
  const sizeConfig = {
    sm: {
      box: 'w-6 h-6 rounded-[5px]',
      svg: 'w-3.5 h-3.5',
      text: 'text-[15px]',
      tag: 'text-[9px] px-1 py-0.2',
      gap: 'gap-2',
    },
    md: {
      box: 'w-7 h-7 rounded-md',
      svg: 'w-4 h-4',
      text: 'text-[17px]',
      tag: 'text-[10px] px-1.5 py-0.5',
      gap: 'gap-2.5',
    },
    lg: {
      box: 'w-9 h-9 rounded-md',
      svg: 'w-5 h-5',
      text: 'text-xl',
      tag: 'text-[10px] px-1.5 py-0.5',
      gap: 'gap-2.5',
    },
    xl: {
      box: 'w-10 h-10 rounded-lg',
      svg: 'w-5 h-5',
      text: 'text-2xl',
      tag: 'text-[11px] px-2 py-0.5',
      gap: 'gap-3',
    },
  }

  const s = sizeConfig[size]
  const displayWordmark = variant === 'full' || showText

  const content = (
    <div className={`inline-flex items-center ${s.gap} select-none shrink-0 ${className}`}>
      <div
        className={`${s.box} bg-[#0D6847] text-white flex items-center justify-center shrink-0 border border-[#095237]`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={s.svg}
          aria-hidden="true"
        >
          <path
            d="M19 12H12V14.5H16.2C15.6 16.6 13.7 18 11.5 18C8.5 18 6 15.5 6 12.5C6 9.5 8.5 7 11.5 7C13.1 7 14.5 7.6 15.5 8.6L17.5 6.6C16 5.1 13.9 4.2 11.5 4.2C6.9 4.2 3.2 7.9 3.2 12.5C3.2 17.1 6.9 20.8 11.5 20.8C16.1 20.8 19.5 17.5 19.5 12.8C19.5 12.5 19.3 12 19 12Z"
            fill="currentColor"
          />
          <circle cx="18.5" cy="6.5" r="2.5" fill="#F6F5F2" />
        </svg>
      </div>

      {displayWordmark && (
        <span
          className={`font-bold tracking-tight text-[#141615] dark:text-[#F2F1ED] leading-none whitespace-nowrap ${s.text}`}
        >
          Günübirlik
        </span>
      )}
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center shrink-0">
        {content}
      </Link>
    )
  }

  return content
}
