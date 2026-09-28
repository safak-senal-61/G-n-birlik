import type { Metadata } from 'next'
import ApiDocsClient from './api-doc-client'

export const metadata: Metadata = {
  title: 'API Dokümantasyonu — Günübirlik İş Bul',
  description:
    'Günübirlik İş Bul platformu REST API ve WebSocket dokümantasyonu. Tüm endpointler, istek/response örnekleri, kimlik doğrulama ve moderasyon sistemi.',
  keywords: ['API', 'REST', 'WebSocket', 'dokümantasyon', 'günübirlik iş', 'platform API'],
}

export default function ApiDocPage() {
  return <ApiDocsClient />
}
