import type { Metadata } from 'next'
import { getLegalContractById } from '@/lib/legal-contracts'
import LegalDocumentView from '@/components/legal/legal-document-view'

export const metadata: Metadata = {
  title: 'Yasal Sözleşmeler, Gizlilik Politikası, Kullanım Koşulları ve KVKK Merkezi',
  description:
    'Günübirlik (https://gunubirlik.qrders.com.tr) Gizlilik Politikası, Kullanım Koşulları, Mesafeli Hizmet Satış Sözleşmesi ve KVKK Aydınlatma Metni.',
  alternates: {
    canonical: '/sozlesmeler',
  },
}

export default function SozlesmelerPage() {
  const defaultContract = getLegalContractById('gizlilik')
  return <LegalDocumentView contract={defaultContract} showAllInOnePage={true} />
}
