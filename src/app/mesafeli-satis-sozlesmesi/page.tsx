import type { Metadata } from 'next'
import { getLegalContractById } from '@/lib/legal-contracts'
import LegalDocumentView from '@/components/legal/legal-document-view'

export const metadata: Metadata = {
  title: 'Mesafeli Hizmet Satış ve Emanet (Escrow) Ödeme Sözleşmesi',
  description:
    'Günübirlik (https://gunubirlik.qrders.com.tr) 6502 sayılı TKHK uyumlu Mesafeli Hizmet Satış ve Emanet Ödeme Sözleşmesi.',
  alternates: {
    canonical: '/mesafeli-satis-sozlesmesi',
  },
}

export default function MesafeliSatisSozlesmesiPage() {
  const contract = getLegalContractById('mesafeli-satis')
  return <LegalDocumentView contract={contract} />
}
