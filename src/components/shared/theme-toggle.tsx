'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Laptop, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle({
  className = '',
  variant = 'icon',
}: {
  className?: string
  variant?: 'icon' | 'dropdown' | 'segmented'
}) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] flex items-center justify-center text-[#5C615E] shrink-0 ${className}`}
        aria-label="Tema değiştir"
      >
        <Moon className="w-4 h-4" />
      </button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] hover:bg-[#F0EFEA] dark:hover:bg-[#222825] flex items-center justify-center transition-colors shrink-0 cursor-pointer ${className}`}
        title={isDark ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
        aria-label="Tema değiştir"
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-[#E5B85B]" />
        ) : (
          <Moon className="w-4 h-4 text-[#141615]" />
        )}
      </button>
    )
  }

  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`px-2.5 py-1.5 rounded-md border border-[#D8D5CC] dark:border-[#2B322E] bg-white dark:bg-[#181C1A] flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer ${className}`}
            title="Tema Seçenekleri"
            aria-label="Tema Seçenekleri"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-[#E5B85B]" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-[#141615]" />
            )}
            <span className="hidden sm:inline">
              {theme === 'system' ? 'Sistem' : isDark ? 'Koyu' : 'Açık'}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-36 rounded-lg p-1 bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28]"
        >
          <DropdownMenuItem
            onClick={() => setTheme('light')}
            className="flex items-center justify-between text-xs py-1.5 rounded-md cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5" />
              <span>Açık</span>
            </div>
            {theme === 'light' && <Check className="w-3.5 h-3.5 text-[#0D6847]" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme('dark')}
            className="flex items-center justify-between text-xs py-1.5 rounded-md cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5" />
              <span>Koyu</span>
            </div>
            {theme === 'dark' && <Check className="w-3.5 h-3.5 text-[#0D6847]" />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme('system')}
            className="flex items-center justify-between text-xs py-1.5 rounded-md cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5" />
              <span>Sistem</span>
            </div>
            {theme === 'system' && <Check className="w-3.5 h-3.5 text-[#0D6847]" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div
      className={`flex w-full items-center p-1 rounded-md bg-[#F0EFEA] dark:bg-[#1C211F] border border-[#D8D5CC] dark:border-[#2A302D] gap-1 ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex-1 justify-center flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
          theme === 'light'
            ? 'bg-white dark:bg-[#141716] text-[#141615] dark:text-white shadow-2xs'
            : 'text-[#5C615E] dark:text-[#949B97]'
        }`}
      >
        <Sun className="w-3.5 h-3.5 shrink-0" />
        <span>Açık</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex-1 justify-center flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
          theme === 'dark'
            ? 'bg-white dark:bg-[#141716] text-[#141615] dark:text-white shadow-2xs'
            : 'text-[#5C615E] dark:text-[#949B97]'
        }`}
      >
        <Moon className="w-3.5 h-3.5 shrink-0" />
        <span>Koyu</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`flex-1 justify-center flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
          theme === 'system'
            ? 'bg-white dark:bg-[#141716] text-[#141615] dark:text-white shadow-2xs'
            : 'text-[#5C615E] dark:text-[#949B97]'
        }`}
      >
        <Laptop className="w-3.5 h-3.5 shrink-0" />
        <span>Sistem</span>
      </button>
    </div>
  )
}
