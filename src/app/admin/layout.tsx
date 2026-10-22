'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/lib/admin-store'
import AdminLogin from '@/components/admin/admin-login'
import AdminShell from '@/components/admin/admin-shell'
import { ShieldCheck } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuth()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        await useAdminAuth.getState().initialize()
      } catch (err) {
        console.error('Admin auth init error:', err)
      } finally {
        if (mounted) {
          setChecked(true)
        }
      }
    }
    init()
    return () => {
      mounted = false
    }
  }, [])

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#F6F5F2] dark:bg-[#0C0E0D] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#141716] border border-[#E2E0D8] dark:border-[#252B28] rounded-md p-6 flex flex-col items-center gap-3 shadow-sm">
          <div className="w-11 h-11 rounded-md bg-[#0D6847]/10 border border-[#0D6847]/30 flex items-center justify-center animate-pulse">
            <ShieldCheck className="w-5 h-5 text-[#0D6847] dark:text-[#27AB78]" />
          </div>
          <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#5A605D] dark:text-[#8E9893]">
            00 / YÖNETİM KAYIT DEFTERİ YÜKLENİYOR...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin />
  }

  return <AdminShell>{children}</AdminShell>
}
