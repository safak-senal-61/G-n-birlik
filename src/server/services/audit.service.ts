/**
 * Audit Log Service - Kullanıcı işlemlerini kaydeder
 *
 * Production'da ayrı bir veritabanına (örn. ClickHouse, Elasticsearch)
 * veya bir log servisine (Logtail, Datadog) gönderilir.
 *
 * Geliştirmede console'a yazılır.
 */

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET_REQUEST'
  | 'PASSWORD_RESET_SUCCESS'
  | 'EMAIL_CHANGE_REQUEST'
  | 'EMAIL_CHANGE_SUCCESS'
  | '2FA_ENABLE'
  | '2FA_DISABLE'
  | '2FA_LOGIN_FAILED'
  | 'AVATAR_UPLOAD'
  | 'GOOGLE_LOGIN'
  | 'PROFILE_UPDATE'
  | 'JOB_CREATE'
  | 'JOB_UPDATE'
  | 'JOB_DELETE'
  | 'APPLICATION_CREATE'
  | 'APPLICATION_UPDATE'

export interface AuditLogEntry {
  userId?: string
  action: AuditAction
  ip?: string
  userAgent?: string
  details?: any
  timestamp: Date
}

class AuditLogger {
  private logs: AuditLogEntry[] = []
  private maxLogs = 1000 // Memory'de son 1000 log

  log(entry: Omit<AuditLogEntry, 'timestamp'>) {
    const fullEntry: AuditLogEntry = {
      ...entry,
      timestamp: new Date(),
    }

    this.logs.push(fullEntry)

    // Memory'de max 1000 log tut
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console'a yaz
    const time = fullEntry.timestamp.toISOString().split('T')[1].split('.')[0]
    const details = entry.details ? ' details=' + JSON.stringify(entry.details) : ''

    console.log(
      `[${time}] AUDIT ${entry.action} ` +
      'user=' + (entry.userId || 'anonymous') + ' ' +
      'ip=' + (entry.ip || '-') + details
    )

    // Production'da external log servisine gönder
    // if (process.env.NODE_ENV === 'production') {
    //   fetch('https://logs.example.com/ingest', { ... })
    // }
  }

  /**
   * Son N logu getir (admin paneli için)
   */
  getRecent(count = 100): AuditLogEntry[] {
    return this.logs.slice(-count).reverse()
  }

  /**
   * Belirli bir kullanıcının logları
   */
  getByUser(userId: string, count = 50): AuditLogEntry[] {
    return this.logs
      .filter((l) => l.userId === userId)
      .slice(-count)
      .reverse()
  }
}

export const auditLogger = new AuditLogger()

/**
 * Request'ten IP ve User-Agent çıkar
 */
export function getRequestInfo(req: Request): { ip: string; userAgent: string } {
  return {
    ip: req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
  }
}
