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
      <DialogContent className="w-[calc(100vw-20px)] sm:max-w-[460px] p-0 overflow-hidden border border-[#D8D5CC] dark:border-[#262C29] bg-white dark:bg-[#141716] rounded-lg shadow-xl max-h-[92vh]">
        <VisuallyHidden>
          <DialogTitle>{authModalTitle}</DialogTitle>
          <DialogDescription>{authModalDescription}</DialogDescription>
        </VisuallyHidden>
        <div className="w-full overflow-y-auto max-h-[90vh]">
          <AuthScreen isModal={true} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
