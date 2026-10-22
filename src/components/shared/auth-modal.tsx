'use client'

import React from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useApp } from '@/lib/app-store'
import AuthScreen from '@/components/screens/auth-screen'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export default function AuthModal() {
  const { authModalOpen, closeAuthModal, authModalTitle, authModalDescription } = useApp()

  return (
    <Dialog open={authModalOpen} onOpenChange={(open) => !open && closeAuthModal()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-transparent shadow-2xl max-h-[92vh] sm:max-h-[88vh]">
        <VisuallyHidden>
          <DialogTitle>{authModalTitle}</DialogTitle>
          <DialogDescription>{authModalDescription}</DialogDescription>
        </VisuallyHidden>
        <div className="w-full h-full overflow-y-auto max-h-[90vh]">
          <AuthScreen isModal={true} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
