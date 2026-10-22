import type { Metadata } from 'next'
import { getLegalContractById } from '@/lib/legal-contracts'
import LegalDocumentView from '@/components/legal/legal-document-view'

export const metadata: Metadata = {
  title: 'Kullanım Koşulları ve Platform Üyelik Sözleşmesi',
  description:
    'Günübirlik (https://gunubirlik.qrders.com.tr) Kullanım Koşulları, Çalışan (İşçi) ve İşveren (İşletme) Platform Üyelik Sözleşmesi.',
  alternates: {
    canonical: '/kullanim-kosullari',
  },
}

export default function KullanimKosullariPage() {
  const contract = getLegalContractById('kullanici')
  return <LegalDocumentView contract={contract} />
}
