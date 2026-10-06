import React from 'react'

export interface JobPostingData {
  id: string
  title: string
  description: string
  workDate: string | Date
  wageAmount: number
  wageType?: string
  currency?: string
  city: string
  district?: string | null
  address?: string | null
  latitude?: number | null
  longitude?: number | null
  createdAt: string | Date
  employer?: {
    fullName: string
    companyName?: string | null
  } | null
}

export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Günübirlik İş Bul',
    alternateName: 'Günübirlik',
    url: 'https://gunubirlik.space-z.ai',
    logo: 'https://gunubirlik.space-z.ai/logo.svg',
    description: "Türkiye'nin güvenilir konum bazlı günübirlik ve part-time iş platformu.",
    sameAs: [
      'https://www.instagram.com/gunubirlikapp',
      'https://twitter.com/gunubirlikapp',
      'https://www.linkedin.com/company/gunubirlik',
      'https://github.com/safak-senal-61/G-n-birlik',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+90-850-000-0000',
      contactType: 'customer support',
      areaServed: 'TR',
      availableLanguage: ['Turkish'],
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function WebSiteSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Günübirlik İş Bul',
    url: 'https://gunubirlik.space-z.ai',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://gunubirlik.space-z.ai/?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function JobPostingSchema({ job }: { job: JobPostingData }) {
  const datePosted = new Date(job.createdAt).toISOString()
  const validThrough = new Date(new Date(job.workDate).getTime() + 24 * 60 * 60 * 1000).toISOString()
  const hiringOrgName = job.employer?.companyName || job.employer?.fullName || 'Günübirlik İşveren'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted,
    validThrough,
    employmentType: job.wageType === 'HOURLY' ? 'PART_TIME' : 'TEMPORARY',
    hiringOrganization: {
      '@type': 'Organization',
      name: hiringOrgName,
      sameAs: 'https://gunubirlik.space-z.ai',
      logo: 'https://gunubirlik.space-z.ai/logo.svg',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.district || job.city,
        addressRegion: job.city,
        addressCountry: 'TR',
      },
      ...(job.latitude && job.longitude
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: job.latitude,
              longitude: job.longitude,
            },
          }
        : {}),
    },
    baseSalary: {
      '@type': 'MonetaryAmount',
      currency: job.currency || 'TRY',
      value: {
        '@type': 'QuantitativeValue',
        value: job.wageAmount,
        unitText: job.wageType === 'HOURLY' ? 'HOUR' : 'DAY',
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; url: string }[]
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export function FAQSchema({
  faqs,
}: {
  faqs: { question: string; answer: string }[]
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
