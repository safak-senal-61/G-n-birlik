import type { Metadata } from 'next'
import { getLegalContractById, LEGAL_CONTRACTS } from '@/lib/legal-contracts'
import LegalDocumentView from '@/components/legal/legal-document-view'

export function generateStaticParams() {
  return LEGAL_CONTRACTS.map((c) => ({ slug: c.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const contract = getLegalContractById(slug)
  return {
    title: contract.title,
    description: contract.summary,
    alternates: {
      canonical: contract.path,
    },
  }
}

export default async function SozlesmeDetayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const contract = getLegalContractById(slug)
  return <LegalDocumentView contract={contract} />
}
