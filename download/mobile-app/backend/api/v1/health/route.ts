import { ok } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'

// GET /api/v1/health - Sistem sağlık kontrolü
export const GET = withErrorHandler(async () => {
  return ok({
    status: 'healthy',
    service: 'Günübirlik İş Bulma Platformu API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: ['/api/v1/auth/register', '/api/v1/auth/login', '/api/v1/auth/logout', '/api/v1/auth/me'],
      jobs: ['/api/v1/jobs', '/api/v1/jobs/[id]', '/api/v1/jobs/saved', '/api/v1/jobs/categories'],
      applications: ['/api/v1/applications', '/api/v1/applications/[id]', '/api/v1/applications/by-job', '/api/v1/applications/by-employer'],
      conversations: ['/api/v1/conversations', '/api/v1/conversations/[id]/messages'],
      notifications: ['/api/v1/notifications', '/api/v1/notifications/read-all'],
      users: ['/api/v1/users/[id]'],
      websocket: 'wss://<host>/?XTransformPort=3004',
    },
  })
})
