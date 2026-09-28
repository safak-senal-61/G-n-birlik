'use client'

import { useEffect, useState } from 'react'
import { useAdminAuth } from '@/lib/admin-store'
import AdminLogin from '@/components/admin/admin-login'
import AdminShell from '@/components/admin/admin-shell'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, initialize } = useAdminAuth()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    initialize()
    setChecked(true)
  }, [initialize])

  if (!checked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-pulse" />
          <p className="text-slate-400 text-sm">Yönetim paneli yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin />
  }

  return <AdminShell>{children}</AdminShell>
}
