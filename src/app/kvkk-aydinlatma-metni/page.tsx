import type { Metadata } from 'next'
import { getLegalContractById } from '@/lib/legal-contracts'
import LegalDocumentView from '@/components/legal/legal-document-view'

export const metadata: Metadata = {
  title: '6698 Sayılı KVKK Aydınlatma Metni ve Açık Rıza Beyanı',
  description:
    'Günübirlik (https://gunubirlik.qrders.com.tr) 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni ve Açık Rıza Beyanı.',
  alternates: {
    canonical: '/kvkk-aydinlatma-metni',
  },
}

export default function KvkkAydinlatmaMetniPage() {
  const contract = getLegalContractById('kvkk')
  return <LegalDocumentView contract={contract} />
}
