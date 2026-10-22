import type { Metadata } from 'next'
import { getLegalContractById } from '@/lib/legal-contracts'
import LegalDocumentView from '@/components/legal/legal-document-view'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası ve Google OAuth Kullanıcı Verileri Politikası',
  description:
    'Günübirlik (https://gunubirlik.qrders.com.tr) Gizlilik, Çerez, Saha Güvenliği ve Google OAuth 2.0 Kullanıcı Verileri Politikası.',
  alternates: {
    canonical: '/gizlilik-politikasi',
  },
}

export default function GizlilikPolitikasiPage() {
  const contract = getLegalContractById('gizlilik')
  return <LegalDocumentView contract={contract} />
}
