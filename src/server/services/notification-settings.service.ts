/**
 * Notification Settings Service
 * Kullanıcı bazlı bildirim tercihleri — her kategori ayrı açılıp kapanabilir
 * createNotification() her çağrıldığında ayar kontrol edilir
 */

import { db } from '@/lib/db'
import { ApiError } from './auth.service'

// Bildirim tipleri → settings alan eşleştirmesi
const NOTIFICATION_TYPE_TO_SETTING: Record<string, string> = {
  JOB_APPLIED: 'jobApplied',
  APPLICATION_ACCEPTED: 'applicationAccepted',
  APPLICATION_REJECTED: 'applicationRejected',
  APPLICATION_WITHDRAWN: 'applicationAccepted',
  JOB_REMINDER: 'jobReminder',
  JOB_NEARBY: 'jobNearby',
  JOB_PENDING_APPROVAL: 'systemUpdate',
  JOB_APPROVED: 'systemUpdate',
  JOB_REJECTED: 'systemUpdate',
  NEW_MESSAGE: 'newMessage',
  PAYMENT_PENDING: 'paymentReceived',
  PAYMENT_APPROVED: 'paymentApproved',
  PAYMENT_REJECTED: 'paymentRejected',
  PAYMENT_DISPUTE_RESOLVED: 'paymentApproved',
  WALLET_DEPOSIT: 'walletDeposit',
  WALLET_WITHDRAW_PENDING: 'walletWithdraw',
  WALLET_WITHDRAW_COMPLETED: 'walletWithdraw',
  WALLET_WITHDRAW_REJECTED: 'walletWithdraw',
  WALLET_TRANSFER_RECEIVED: 'paymentReceived',
  WALLET_QR_PAYMENT_SENT: 'paymentReceived',
  WALLET_QR_PAYMENT_RECEIVED: 'paymentReceived',
  WORK_STARTED: 'workStarted',
  WORK_COMPLETED: 'workCompleted',
  ESCROW_DISPUTED: 'escrowDisputed',
  DEPOSIT_REQUEST: 'systemUpdate',
  WITHDRAWAL_REQUEST: 'systemUpdate',
  DEPOSIT_REJECTED: 'walletDeposit',
  VERIFICATION_APPROVED: 'systemUpdate',
  VERIFICATION_REJECTED: 'systemUpdate',
  ACCOUNT_SUSPENDED: 'systemUpdate',
  ACCOUNT_WARNING: 'systemUpdate',
  ACCOUNT_REACTIVATED: 'systemUpdate',
  MAINTENANCE_ENABLED: 'maintenance',
  MAINTENANCE_DISABLED: 'maintenance',
  SETTINGS_UPDATE: 'systemUpdate',
}

export class NotificationSettingsService {
  /**
   * Kullanıcının ayarlarını getir (yoksa oluştur)
   */
  async getSettings(userId: string) {
    let settings = await db.notificationSettings.findUnique({
      where: { userId },
    })

    if (!settings) {
      settings = await db.notificationSettings.create({
        data: { userId },
      })
    }

    return settings
  }

  /**
   * Ayarları güncelle
   */
  async updateSettings(userId: string, data: Partial<{
    jobApplied: boolean
    applicationAccepted: boolean
    applicationRejected: boolean
    jobReminder: boolean
    jobNearby: boolean
    newMessage: boolean
    paymentReceived: boolean
    paymentApproved: boolean
    paymentRejected: boolean
    walletDeposit: boolean
    walletWithdraw: boolean
    workStarted: boolean
    workCompleted: boolean
    escrowDisputed: boolean
    systemUpdate: boolean
    maintenance: boolean
    promotional: boolean
    pushEnabled: boolean
  }>) {
    // Önce var mı kontrol et, yoksa oluştur
    await this.getSettings(userId)

    return db.notificationSettings.update({
      where: { userId },
      data,
    })
  }

  /**
   * Belirli bir bildirim tipi için kullanıcının ayarı açık mı?
   * createNotification() tarafından çağrılır
   */
  async isNotificationEnabled(userId: string, type: string): Promise<boolean> {
    const settings = await this.getSettings(userId)

    // Genel push kapalıysa hiç gönderme
    if (!settings.pushEnabled) return false

    // Bildirim tipine karşılık gelen ayar alanı
    const settingField = NOTIFICATION_TYPE_TO_SETTING[type]
    if (!settingField) return true // Eşleştirme yoksa varsayılan: açık

    const isEnabled = (settings as any)[settingField]
    return isEnabled !== false // undefined veya true ise açık
  }

  /**
   * Tüm push'ları aç
   */
  async enableAllPush(userId: string) {
    return this.updateSettings(userId, { pushEnabled: true })
  }

  /**
   * Tüm push'ları kapat
   */
  async disableAllPush(userId: string) {
    return this.updateSettings(userId, { pushEnabled: false })
  }

  /**
   * Tüm ayarları varsayılana sıfırla
   */
  async resetToDefault(userId: string) {
    await this.getSettings(userId) // yoksa oluştur
    return db.notificationSettings.update({
      where: { userId },
      data: {
        jobApplied: true,
        applicationAccepted: true,
        applicationRejected: true,
        jobReminder: true,
        jobNearby: true,
        newMessage: true,
        paymentReceived: true,
        paymentApproved: true,
        paymentRejected: true,
        walletDeposit: true,
        walletWithdraw: true,
        workStarted: true,
        workCompleted: true,
        escrowDisputed: true,
        systemUpdate: true,
        maintenance: true,
        promotional: true,
        pushEnabled: true,
      },
    })
  }
}

export const notificationSettingsService = new NotificationSettingsService()
