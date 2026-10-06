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
import { toast } from 'sonner'

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
        className={`btn-3d-white w-9 h-9 rounded-full flex items-center justify-center text-gray-500 opacity-60 ${className}`}
        aria-label="Tema değiştir"
      >
        <Moon className="w-4 h-4" />
      </button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark'
    setTheme(next)
    toast.success(next === 'dark' ? '🌙 Koyu tema aktif' : '☀️ Açık tema aktif', {
      duration: 2000,
    })
  }

  // 1. Standart tek tıkla toggle (Icon Button)
  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`btn-3d-white w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 group relative overflow-hidden ${className}`}
        title={isDark ? 'Açık Temaya Geç (Gündüz Modu)' : 'Koyu Temaya Geç (Gece Modu)'}
        aria-label="Tema değiştir"
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          {/* Sun Icon */}
          <Sun
            className={`w-4 h-4 text-amber-400 absolute transition-all duration-300 transform ${
              isDark
                ? 'rotate-0 scale-100 opacity-100 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                : 'rotate-90 scale-0 opacity-0'
            }`}
          />
          {/* Moon Icon */}
          <Moon
            className={`w-4 h-4 text-slate-700 dark:text-slate-300 absolute transition-all duration-300 transform ${
              isDark
                ? '-rotate-90 scale-0 opacity-0'
                : 'rotate-0 scale-100 opacity-100'
            }`}
          />
        </div>
      </button>
    )
  }

  // 2. Dropdown Menü (Açık, Koyu, Sistem seçimi)
  if (variant === 'dropdown') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`btn-3d-white px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold transition-all active:scale-95 ${className}`}
            title="Tema Seçenekleri"
            aria-label="Tema Seçenekleri"
          >
            {isDark ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-700" />
            )}
            <span className="hidden sm:inline">
              {theme === 'system' ? 'Sistem' : isDark ? 'Koyu' : 'Açık'}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 rounded-xl p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xl">
          <DropdownMenuItem
            onClick={() => {
              setTheme('light')
              toast.success('☀️ Açık tema seçildi')
            }}
            className="flex items-center justify-between text-xs py-2 rounded-lg cursor-pointer text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Açık Tema</span>
            </div>
            {theme === 'light' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setTheme('dark')
              toast.success('🌙 Koyu tema seçildi')
            }}
            className="flex items-center justify-between text-xs py-2 rounded-lg cursor-pointer text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>Koyu Tema</span>
            </div>
            {theme === 'dark' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              setTheme('system')
              toast.success('💻 Sistem teması seçildi')
            }}
            className="flex items-center justify-between text-xs py-2 rounded-lg cursor-pointer text-slate-800 dark:text-slate-200"
          >
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-slate-400" />
              <span>Sistem Teması</span>
            </div>
            {theme === 'system' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // 3. Segmented Switch Bar (Profil, Menü ve Ayarlar ekranı için)
  return (
    <div className={`flex w-full items-center p-1 rounded-2xl inset-3d gap-1 ${className}`}>
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex-1 justify-center flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
          theme === 'light'
            ? 'btn-3d-white text-amber-700 dark:text-amber-400 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>Açık</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex-1 justify-center flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
          theme === 'dark'
            ? 'btn-3d-white text-indigo-500 dark:text-indigo-300 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <span>Koyu</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`flex-1 justify-center flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
          theme === 'system'
            ? 'btn-3d-white text-emerald-600 dark:text-emerald-400 shadow-sm'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span>Sistem</span>
      </button>
    </div>
  )
}
