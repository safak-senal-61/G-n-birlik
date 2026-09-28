/**
 * Wallet Service - Cüzdan yönetimi
 *
 * Özellikler:
 *  - Bakiye sorgulama
 *  - Para yükleme (DEPOSIT) - admin veya ödeme sistemi
 *  - Para çekme (WITHDRAW) - kullanıcı banka hesabına
 *  - Transfer (TRANSFER) - kullanıcılar arası
 *  - QR ile ödeme (QR_PAYMENT) - işveren QR üretir, işçi tarar
 *  - İş ücreti ödemesi (JOB_PAYMENT) - COMPLETED job sonrası
 *  - İşlem geçmişi (listTransactions)
 *
 * Güvenlik:
 *  - Tüm işlemler transaction içinde yapılır
 *  - Bakiye negatif olamaz
 *  - Her işlem için WalletTransaction kaydı oluşturulur
 *  - balanceAfter alanı ile işlem sonrası bakiye kaydedilir
 */
import { db } from '@/lib/db'
import { createNotification } from '@/server/lib/auth'
import { ApiError } from './auth.service'
import QRCode from 'qrcode'
import crypto from 'crypto'

const QR_EXPIRY_MINUTES = 5
const MIN_WITHDRAW_AMOUNT = 50
const MIN_TRANSFER_AMOUNT = 10

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'TRANSFER'
  | 'QR_PAYMENT'
  | 'JOB_PAYMENT'
  | 'REFUND'
  | 'FEE'
  | 'BONUS'

export interface WalletBalance {
  balance: number
  currency: string
  updatedAt: Date | null
}

export interface TransactionResult {
  transactionId: string
  balanceAfter: number
  amount: number
  type: string
  status: string
}

class WalletService {
  /**
   * Kullanıcı bakiyesi getir
   */
  async getBalance(userId: string): Promise<WalletBalance> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, walletCurrency: true, walletUpdatedAt: true },
    })
    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)
    return {
      balance: user.walletBalance,
      currency: user.walletCurrency,
      updatedAt: user.walletUpdatedAt,
    }
  }

  /**
   * İşlem geçmişi
   */
  async listTransactions(
    userId: string,
    options: { type?: string; page?: number; pageSize?: number } = {}
  ) {
    const { type, page = 1, pageSize = 20 } = options
    const where: any = { userId }
    if (type && type !== 'ALL') where.type = type

    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      db.walletTransaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          counterparty: {
            select: { id: true, fullName: true, avatarUrl: true, companyName: true },
          },
          sender: {
            select: { id: true, fullName: true, avatarUrl: true, companyName: true },
          },
        },
      }),
      db.walletTransaction.count({ where }),
    ])

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    }
  }

  /**
   * Para yükleme (DEPOSIT)
   * Sadece admin veya ödeme sistemi çağırır
   */
  async deposit(params: {
    userId: string
    amount: number
    description?: string
    reference?: string
    note?: string
    adminId?: string
    ipAddress?: string
  }): Promise<TransactionResult> {
    const { userId, amount, description, reference, note, adminId, ipAddress } = params

    if (amount <= 0) throw new ApiError('Yükleme tutarı 0\'dan büyük olmalı.', 400)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

    const balanceAfter = user.walletBalance + amount

    const [updatedUser, transaction] = await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: {
          walletBalance: balanceAfter,
          walletUpdatedAt: new Date(),
        },
      }),
      db.walletTransaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount, // pozitif
          balanceAfter,
          description: description || 'Bakiye yüklendi',
          status: 'COMPLETED',
          reference,
          note,
          ipAddress,
        },
      }),
    ])

    // Bildirim
    await createNotification({
      userId,
      type: 'WALLET_DEPOSIT',
      title: 'Bakiye Yüklendi 💰',
      body: `${amount.toLocaleString('tr-TR')}₺ cüzdanınıza yüklendi. Yeni bakiye: ${balanceAfter.toLocaleString('tr-TR')}₺`,
      data: { transactionId: transaction.id, amount, balanceAfter },
    })

    return {
      transactionId: transaction.id,
      balanceAfter,
      amount,
      type: 'DEPOSIT',
      status: 'COMPLETED',
    }
  }

  /**
   * Para çekme (WITHDRAW)
   * Kullanıcı banka hesabına para çekme talebi
   */
  async withdraw(params: {
    userId: string
    amount: number
    bankInfo?: string
    note?: string
    ipAddress?: string
  }): Promise<TransactionResult> {
    const { userId, amount, bankInfo, note, ipAddress } = params

    if (amount < MIN_WITHDRAW_AMOUNT) {
      throw new ApiError(`Minimum çekme tutarı ${MIN_WITHDRAW_AMOUNT}₺`, 400)
    }

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

    if (user.walletBalance < amount) {
      throw new ApiError(
        `Yetersiz bakiye. Mevcut: ${user.walletBalance.toLocaleString('tr-TR')}₺, İstenen: ${amount.toLocaleString('tr-TR')}₺`,
        400
      )
    }

    const balanceAfter = user.walletBalance - amount

    const [_, transaction] = await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: {
          walletBalance: balanceAfter,
          walletUpdatedAt: new Date(),
        },
      }),
      db.walletTransaction.create({
        data: {
          userId,
          type: 'WITHDRAW',
          amount: -amount, // negatif
          balanceAfter,
          description: bankInfo ? `Para çekme (${bankInfo})` : 'Para çekme talebi',
          status: 'PENDING', // Çekme talebi admin onayı bekler
          note,
          ipAddress,
        },
      }),
    ])

    // Admin'lere bildirim
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', isPermanentlyBanned: false, isSuspended: false },
      select: { id: true },
    })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'WALLET_WITHDRAW_REQUEST',
        title: 'Para Çekme Talebi 💸',
        body: `${user.fullName} ${amount.toLocaleString('tr-TR')}₺ çekme talebi oluşturdu.`,
        data: { transactionId: transaction.id, userId, amount },
      })
    }

    // Kullanıcıya bildirim
    await createNotification({
      userId,
      type: 'WALLET_WITHDRAW_PENDING',
      title: 'Çekme Talebi Alındı ⏳',
      body: `${amount.toLocaleString('tr-TR')}₺ çekme talebiniz alındı. Onay süreci: 1-3 iş günü.`,
      data: { transactionId: transaction.id, amount, balanceAfter },
    })

    return {
      transactionId: transaction.id,
      balanceAfter,
      amount: -amount,
      type: 'WITHDRAW',
      status: 'PENDING',
    }
  }

  /**
   * Transfer (kullanıcılar arası)
   */
  async transfer(params: {
    senderId: string
    recipientId: string
    amount: number
    description?: string
    note?: string
    ipAddress?: string
  }): Promise<TransactionResult> {
    const { senderId, recipientId, amount, description, note, ipAddress } = params

    if (senderId === recipientId) {
      throw new ApiError('Kendinize transfer yapamazsınız.', 400)
    }
    if (amount < MIN_TRANSFER_AMOUNT) {
      throw new ApiError(`Minimum transfer tutarı ${MIN_TRANSFER_AMOUNT}₺`, 400)
    }

    const sender = await db.user.findUnique({ where: { id: senderId } })
    const recipient = await db.user.findUnique({ where: { id: recipientId } })

    if (!sender) throw new ApiError('Gönderen bulunamadı.', 404)
    if (!recipient) throw new ApiError('Alıcı bulunamadı.', 404)

    if (sender.walletBalance < amount) {
      throw new ApiError(
        `Yetersiz bakiye. Mevcut: ${sender.walletBalance.toLocaleString('tr-TR')}₺`,
        400
      )
    }

    const senderBalanceAfter = sender.walletBalance - amount
    const recipientBalanceAfter = recipient.walletBalance + amount

    // Transaction: her iki tarafın bakiyesi güncellenir + 2 işlem kaydı
    const [_, senderTx, recipientTx] = await db.$transaction([
      db.user.update({
        where: { id: senderId },
        data: { walletBalance: senderBalanceAfter, walletUpdatedAt: new Date() },
      }),
      db.user.update({
        where: { id: recipientId },
        data: { walletBalance: recipientBalanceAfter, walletUpdatedAt: new Date() },
      }),
      // Gönderen işlemi (negatif)
      db.walletTransaction.create({
        data: {
          userId: senderId,
          type: 'TRANSFER',
          amount: -amount,
          balanceAfter: senderBalanceAfter,
          description: description || `${recipient.fullName} kişisine transfer`,
          status: 'COMPLETED',
          counterpartyId: recipientId,
          note,
          ipAddress,
        },
      }),
      // Alıcı işlemi (pozitif)
      db.walletTransaction.create({
        data: {
          userId: recipientId,
          type: 'TRANSFER',
          amount,
          balanceAfter: recipientBalanceAfter,
          description: description || `${sender.fullName} kişisinden transfer`,
          status: 'COMPLETED',
          senderId: senderId,
          note,
        },
      }),
    ])

    // Alıcıya bildirim
    await createNotification({
      userId: recipientId,
      type: 'WALLET_TRANSFER_RECEIVED',
      title: 'Para Aldınız 💰',
      body: `${sender.fullName} size ${amount.toLocaleString('tr-TR')}₺ gönderdi. Yeni bakiye: ${recipientBalanceAfter.toLocaleString('tr-TR')}₺`,
      data: { transactionId: recipientTx.id, amount, senderId },
    })

    return {
      transactionId: senderTx.id,
      balanceAfter: senderBalanceAfter,
      amount: -amount,
      type: 'TRANSFER',
      status: 'COMPLETED',
    }
  }

  /**
   * QR ile ödeme - QR üret
   * İşveren (generator) işçiye ödeme için QR üretir
   */
  async generateQrPayment(params: {
    generatorId: string
    amount: number
    description: string
  }): Promise<{
    qrId: string
    token: string
    qrImageDataUrl: string
    expiresAt: Date
    amount: number
    description: string
    generator: any
  }> {
    const { generatorId, amount, description } = params

    if (amount <= 0) throw new ApiError('Ödeme tutarı 0\'dan büyük olmalı.', 400)

    const generator = await db.user.findUnique({
      where: { id: generatorId },
      select: { id: true, fullName: true, walletBalance: true, avatarUrl: true, companyName: true },
    })
    if (!generator) throw new ApiError('Kullanıcı bulunamadı.', 404)

    if (generator.walletBalance < amount) {
      throw new ApiError(
        `Yetersiz bakiye. Mevcut: ${generator.walletBalance.toLocaleString('tr-TR')}₺, Gerekli: ${amount.toLocaleString('tr-TR')}₺`,
        400
      )
    }

    // Eski aktif QR'ları expire et
    await db.walletQrPayment.updateMany({
      where: { generatorId, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    })

    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000)

    // QR payload
    const payload = {
      type: 'WALLET_QR_PAYMENT',
      token,
      generatorId,
      amount,
      description,
      expiresAt: expiresAt.toISOString(),
    }

    const qrImageDataUrl = await QRCode.toDataURL(JSON.stringify(payload), {
      width: 320,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })

    const qr = await db.walletQrPayment.create({
      data: {
        token,
        generatorId,
        amount,
        description,
        qrImageDataUrl,
        expiresAt,
        status: 'ACTIVE',
      },
    })

    return {
      qrId: qr.id,
      token,
      qrImageDataUrl,
      expiresAt,
      amount,
      description,
      generator,
    }
  }

  /**
   * QR ile ödeme - QR tara
   * İşçi (scanner) QR'ı tarar, bakiye transferi gerçekleşir
   */
  async scanQrPayment(params: {
    token: string
    scannerId: string
    ipAddress?: string
  }): Promise<TransactionResult & { qrPayment: any }> {
    const { token, scannerId, ipAddress } = params

    if (!token || token.length < 10) {
      throw new ApiError('Geçersiz QR kodu.', 400)
    }

    const qr = await db.walletQrPayment.findUnique({
      where: { token },
      include: {
        generator: {
          select: { id: true, fullName: true, walletBalance: true, avatarUrl: true, companyName: true },
        },
      },
    })

    if (!qr) throw new ApiError('QR kodu bulunamadı.', 404)

    // Status kontrolü
    if (qr.status === 'USED') throw new ApiError('Bu QR kodu zaten kullanılmış.', 400)
    if (qr.status === 'EXPIRED' || qr.status === 'CANCELLED') {
      throw new ApiError('Bu QR kodu geçersiz.', 400)
    }

    // Süre kontrolü
    if (qr.expiresAt < new Date()) {
      await db.walletQrPayment.update({
        where: { id: qr.id },
        data: { status: 'EXPIRED' },
      })
      throw new ApiError('QR kodunun süresi dolmuş.', 400)
    }

    // Kendi QR'ını tarayamazsın
    if (qr.generatorId === scannerId) {
      throw new ApiError('Kendi QR kodunuzu tarayamazsınız.', 400)
    }

    const generator = qr.generator
    if (generator.walletBalance < qr.amount) {
      throw new ApiError(
        `Gönderenin bakiyesi yetersiz. Ödeme yapılamadı.`,
        400
      )
    }

    const scanner = await db.user.findUnique({
      where: { id: scannerId },
      select: { id: true, fullName: true, walletBalance: true },
    })
    if (!scanner) throw new ApiError('Kullanıcı bulunamadı.', 404)

    const generatorBalanceAfter = generator.walletBalance - qr.amount
    const scannerBalanceAfter = scanner.walletBalance + qr.amount

    // Transaction: bakiyeler güncellenir + 2 işlem kaydı + QR USED
    const [_, __, generatorTx, scannerTx] = await db.$transaction([
      db.user.update({
        where: { id: qr.generatorId },
        data: { walletBalance: generatorBalanceAfter, walletUpdatedAt: new Date() },
      }),
      db.user.update({
        where: { id: scannerId },
        data: { walletBalance: scannerBalanceAfter, walletUpdatedAt: new Date() },
      }),
      // Gönderen işlemi (negatif)
      db.walletTransaction.create({
        data: {
          userId: qr.generatorId,
          type: 'QR_PAYMENT',
          amount: -qr.amount,
          balanceAfter: generatorBalanceAfter,
          description: qr.description,
          status: 'COMPLETED',
          counterpartyId: scannerId,
          qrPaymentId: qr.id,
          ipAddress,
        },
      }),
      // Alıcı işlemi (pozitif)
      db.walletTransaction.create({
        data: {
          userId: scannerId,
          type: 'QR_PAYMENT',
          amount: qr.amount,
          balanceAfter: scannerBalanceAfter,
          description: qr.description,
          status: 'COMPLETED',
          senderId: qr.generatorId,
          qrPaymentId: qr.id,
        },
      }),
      // QR'ı USED yap
      db.walletQrPayment.update({
        where: { id: qr.id },
        data: {
          status: 'USED',
          usedAt: new Date(),
          scannerId,
        },
      }),
    ])

    // Gönderene bildirim
    await createNotification({
      userId: qr.generatorId,
      type: 'WALLET_QR_PAYMENT_SENT',
      title: 'QR Ödemesi Gönderildi 💸',
      body: `${scanner.fullName} QR kodunuzu taradı. ${qr.amount.toLocaleString('tr-TR')}₺ gönderildi. Yeni bakiye: ${generatorBalanceAfter.toLocaleString('tr-TR')}₺`,
      data: { transactionId: generatorTx.id, amount: qr.amount, scannerId },
    })

    // Alıcıya bildirim
    await createNotification({
      userId: scannerId,
      type: 'WALLET_QR_PAYMENT_RECEIVED',
      title: 'QR ile Para Aldınız 💰',
      body: `${generator.fullName} size ${qr.amount.toLocaleString('tr-TR')}₺ gönderdi. Yeni bakiye: ${scannerBalanceAfter.toLocaleString('tr-TR')}₺`,
      data: { transactionId: scannerTx.id, amount: qr.amount, generatorId: qr.generatorId },
    })

    return {
      transactionId: scannerTx.id,
      balanceAfter: scannerBalanceAfter,
      amount: qr.amount,
      type: 'QR_PAYMENT',
      status: 'COMPLETED',
      qrPayment: {
        id: qr.id,
        amount: qr.amount,
        description: qr.description,
        generator: { id: generator.id, fullName: generator.fullName },
      },
    }
  }

  /**
   * İş ücreti ödemesi (JOB_PAYMENT)
   * COMPLETED job sonrası otomatik çağrılır
   */
  async processJobPayment(params: {
    employerId: string
    workerId: string
    amount: number
    jobId: string
    applicationId: string
    description: string
  }): Promise<TransactionResult> {
    const { employerId, workerId, amount, jobId, applicationId, description } = params

    const employer = await db.user.findUnique({ where: { id: employerId } })
    const worker = await db.user.findUnique({ where: { id: workerId } })

    if (!employer || !worker) throw new ApiError('Kullanıcı bulunamadı.', 404)

    if (employer.walletBalance < amount) {
      // İşverenin bakiyesi yetersiz — Payment PENDING olarak kalır, admin onayı bekler
      throw new ApiError('İşverenin bakiyesi yetersiz.', 400)
    }

    const employerBalanceAfter = employer.walletBalance - amount
    const workerBalanceAfter = worker.walletBalance + amount

    const [_, employerTx, workerTx] = await db.$transaction([
      db.user.update({
        where: { id: employerId },
        data: { walletBalance: employerBalanceAfter, walletUpdatedAt: new Date() },
      }),
      db.user.update({
        where: { id: workerId },
        data: { walletBalance: workerBalanceAfter, walletUpdatedAt: new Date() },
      }),
      db.walletTransaction.create({
        data: {
          userId: employerId,
          type: 'JOB_PAYMENT',
          amount: -amount,
          balanceAfter: employerBalanceAfter,
          description,
          status: 'COMPLETED',
          counterpartyId: workerId,
          jobId,
          applicationId,
        },
      }),
      db.walletTransaction.create({
        data: {
          userId: workerId,
          type: 'JOB_PAYMENT',
          amount,
          balanceAfter: workerBalanceAfter,
          description,
          status: 'COMPLETED',
          senderId: employerId,
          jobId,
          applicationId,
        },
      }),
    ])

    return {
      transactionId: workerTx.id,
      balanceAfter: workerBalanceAfter,
      amount,
      type: 'JOB_PAYMENT',
      status: 'COMPLETED',
    }
  }
  // ================================================================
  // PARA YATIRMA TALEBİ (Deposit Request)
  // Kullanıcı kendi bankasından EFT/Havale ile para yatıracak
  // Admin onaylayınca bakiyeye yansır
  // ================================================================

  async createDepositRequest(params: {
    userId: string
    amount: number
    senderName: string
    senderIban: string
    senderBank?: string
    senderNote?: string
  }): Promise<any> {
    const { userId, amount, senderName, senderIban, senderBank, senderNote } = params

    if (amount < 50) throw new ApiError('Minimum yükleme tutarı 50₺', 400)
    if (!senderName || senderName.trim().length < 3) throw new ApiError('Ad Soyad gerekli', 400)
    if (!senderIban || senderIban.trim().length < 10) throw new ApiError('Geçerli IBAN gerekli', 400)

    const request = await db.depositRequest.create({
      data: {
        userId,
        amount,
        senderName: senderName.trim(),
        senderIban: senderIban.trim().toUpperCase(),
        senderBank: senderBank?.trim() || null,
        senderNote: senderNote?.trim() || null,
        status: 'PENDING',
      },
    })

    // Admin'lere bildirim
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', isPermanentlyBanned: false, isSuspended: false },
      select: { id: true },
    })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'DEPOSIT_REQUEST',
        title: 'Para Yatırma Talebi 💰',
        body: `${amount.toLocaleString('tr-TR')}₺ yatırım talebi. IBAN: ${senderIban.slice(-4)}`,
        data: { requestId: request.id, userId, amount },
      })
    }

    return request
  }

  async listDepositRequests(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      db.depositRequest.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.depositRequest.count({ where: { userId } }),
    ])
    return {
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  }

  // Admin: para yatırma talebini onayla
  async approveDepositRequest(params: {
    requestId: string
    adminId: string
    note?: string
  }): Promise<any> {
    const { requestId, adminId, note } = params

    const req = await db.depositRequest.findUnique({ where: { id: requestId } })
    if (!req) throw new ApiError('Talep bulunamadı.', 404)
    if (req.status !== 'PENDING') throw new ApiError('Bu talep zaten işlenmiş.', 400)

    const user = await db.user.findUnique({ where: { id: req.userId } })
    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

    const balanceAfter = user.walletBalance + req.amount

    const [updatedReq, _, tx] = await db.$transaction([
      db.depositRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedById: adminId,
          reviewedAt: new Date(),
          reviewNote: note,
        },
      }),
      db.user.update({
        where: { id: req.userId },
        data: { walletBalance: balanceAfter, walletUpdatedAt: new Date() },
      }),
      db.walletTransaction.create({
        data: {
          userId: req.userId,
          type: 'DEPOSIT',
          amount: req.amount,
          balanceAfter,
          description: `Banka yatırması - ${req.senderName} (${req.senderIban.slice(-4)})`,
          status: 'COMPLETED',
          reference: requestId,
        },
      }),
    ])

    // Update deposit request with transaction ID
    await db.depositRequest.update({
      where: { id: requestId },
      data: { transactionId: tx.id },
    })

    await createNotification({
      userId: req.userId,
      type: 'WALLET_DEPOSIT',
      title: 'Bakiye Yüklendi 💰',
      body: `${req.amount.toLocaleString('tr-TR')}₺ bakiyenize yüklendi. Yeni bakiye: ${balanceAfter.toLocaleString('tr-TR')}₺`,
      data: { transactionId: tx.id, amount: req.amount },
    })

    return { request: updatedReq, transaction: tx, balanceAfter }
  }

  // Admin: para yatırma talebini reddet
  async rejectDepositRequest(params: {
    requestId: string
    adminId: string
    reason: string
  }): Promise<any> {
    const { requestId, adminId, reason } = params

    const req = await db.depositRequest.findUnique({ where: { id: requestId } })
    if (!req) throw new ApiError('Talep bulunamadı.', 404)
    if (req.status !== 'PENDING') throw new ApiError('Bu talep zaten işlenmiş.', 400)

    const updated = await db.depositRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        reviewNote: reason,
      },
    })

    await createNotification({
      userId: req.userId,
      type: 'DEPOSIT_REJECTED',
      title: 'Yatırma Talebi Reddedildi ❌',
      body: `${req.amount.toLocaleString('tr-TR')}₺ yatırım talebiniz reddedildi. Sebep: ${reason}`,
    })

    return updated
  }

  // ================================================================
  // PARA ÇEKME TALEBİ (Withdrawal Request)
  // Kullanıcı cüzdan bakiyesini IBAN'a çekmek istiyor
  // Admin onaylayınca bakiyeden düşülür
  // ================================================================

  async createWithdrawalRequest(params: {
    userId: string
    amount: number
    recipientName: string
    recipientIban: string
    recipientBank?: string
    recipientNote?: string
  }): Promise<any> {
    const { userId, amount, recipientName, recipientIban, recipientBank, recipientNote } = params

    if (amount < 50) throw new ApiError('Minimum çekme tutarı 50₺', 400)
    if (!recipientName || recipientName.trim().length < 3) throw new ApiError('Ad Soyad gerekli', 400)
    if (!recipientIban || recipientIban.trim().length < 10) throw new ApiError('Geçerli IBAN gerekli', 400)

    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)
    if (user.walletBalance < amount) {
      throw new ApiError(`Yetersiz bakiye. Mevcut: ${user.walletBalance.toLocaleString('tr-TR')}₺`, 400)
    }

    // Bakiyeden hemen düş (emanete al), admin onayı bekler
    const balanceAfter = user.walletBalance - amount

    const [request, _, tx] = await db.$transaction([
      db.withdrawalRequest.create({
        data: {
          userId,
          amount,
          recipientName: recipientName.trim(),
          recipientIban: recipientIban.trim().toUpperCase(),
          recipientBank: recipientBank?.trim() || null,
          recipientNote: recipientNote?.trim() || null,
          status: 'PENDING',
        },
      }),
      db.user.update({
        where: { id: userId },
        data: { walletBalance: balanceAfter, walletUpdatedAt: new Date() },
      }),
      db.walletTransaction.create({
        data: {
          userId,
          type: 'WITHDRAW',
          amount: -amount,
          balanceAfter,
          description: `Para çekme talebi - ${recipientName} (${recipientIban.slice(-4)})`,
          status: 'PENDING',
        },
      }),
    ])

    // Update withdrawal request with transaction ID
    await db.withdrawalRequest.update({
      where: { id: request.id },
      data: { transactionId: tx.id },
    })

    // Admin'lere bildirim
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', isPermanentlyBanned: false, isSuspended: false },
      select: { id: true },
    })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'WITHDRAWAL_REQUEST',
        title: 'Para Çekme Talebi 💸',
        body: `${user.fullName} ${amount.toLocaleString('tr-TR')}₺ çekme talebi. IBAN: ${recipientIban.slice(-4)}`,
        data: { requestId: request.id, userId, amount },
      })
    }

    await createNotification({
      userId,
      type: 'WALLET_WITHDRAW_PENDING',
      title: 'Çekme Talebi Alındı ⏳',
      body: `${amount.toLocaleString('tr-TR')}₺ çekme talebiniz alındı. İnceleniyor, 3-5 iş günü içinde sonuçlanacak.`,
    })

    return { request, transaction: tx, balanceAfter }
  }

  async listWithdrawalRequests(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize
    const [items, total] = await Promise.all([
      db.withdrawalRequest.findMany({
        where: { userId },
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.withdrawalRequest.count({ where: { userId } }),
    ])
    return {
      items,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    }
  }

  // Admin: çekme talebini onayla (ödemeyi yaptığını işaretle)
  async approveWithdrawalRequest(params: {
    requestId: string
    adminId: string
    note?: string
  }): Promise<any> {
    const { requestId, adminId, note } = params

    const req = await db.withdrawalRequest.findUnique({ where: { id: requestId } })
    if (!req) throw new ApiError('Talep bulunamadı.', 404)
    if (req.status !== 'PENDING') throw new ApiError('Bu talep zaten işlenmiş.', 400)

    const updated = await db.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: 'COMPLETED',
        reviewedById: adminId,
        reviewedAt: new Date(),
        completedAt: new Date(),
        reviewNote: note,
      },
    })

    // Transaction'ı COMPLETED yap
    if (req.transactionId) {
      await db.walletTransaction.update({
        where: { id: req.transactionId },
        data: { status: 'COMPLETED' },
      })
    }

    await createNotification({
      userId: req.userId,
      type: 'WALLET_WITHDRAW_COMPLETED',
      title: 'Çekme Talebi Onaylandı ✅',
      body: `${req.amount.toLocaleString('tr-TR')}₺ IBAN'a gönderildi: ${req.recipientName} (${req.recipientIban.slice(-4)})`,
    })

    return updated
  }

  // Admin: çekme talebini reddet (para geri verilir)
  async rejectWithdrawalRequest(params: {
    requestId: string
    adminId: string
    reason: string
  }): Promise<any> {
    const { requestId, adminId, reason } = params

    const req = await db.withdrawalRequest.findUnique({ where: { id: requestId } })
    if (!req) throw new ApiError('Talep bulunamadı.', 404)
    if (req.status !== 'PENDING') throw new ApiError('Bu talep zaten işlenmiş.', 400)

    const user = await db.user.findUnique({ where: { id: req.userId } })
    if (!user) throw new ApiError('Kullanıcı bulunamadı.', 404)

    // Para geri ver
    const balanceAfter = user.walletBalance + req.amount

    const [updated, _, tx] = await db.$transaction([
      db.withdrawalRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          reviewedById: adminId,
          reviewedAt: new Date(),
          reviewNote: reason,
        },
      }),
      db.user.update({
        where: { id: req.userId },
        data: { walletBalance: balanceAfter, walletUpdatedAt: new Date() },
      }),
      db.walletTransaction.create({
        data: {
          userId: req.userId,
          type: 'REFUND',
          amount: req.amount,
          balanceAfter,
          description: `Çekme talebi reddi - iade (${req.amount.toLocaleString('tr-TR')}₺)`,
          status: 'COMPLETED',
          reference: requestId,
        },
      }),
    ])

    // Eski transaction'ı CANCELLED yap
    if (req.transactionId) {
      await db.walletTransaction.update({
        where: { id: req.transactionId },
        data: { status: 'CANCELLED' },
      })
    }

    await createNotification({
      userId: req.userId,
      type: 'WALLET_WITHDRAW_REJECTED',
      title: 'Çekme Talebi Reddedildi ❌',
      body: `${req.amount.toLocaleString('tr-TR')}₺ çekme talebiniz reddedildi. Para cüzdanınıza iade edildi. Sebep: ${reason}`,
    })

    return { request: updated, balanceAfter }
  }

  // ================================================================
  // EMANET (ESCROW) SİSTEMİ
  // ================================================================

  // İşveren iş oluştururken emanete para al
  async holdEscrow(params: {
    employerId: string
    jobId: string
    amount: number
  }): Promise<any> {
    const { employerId, jobId, amount } = params

    if (amount <= 0) throw new ApiError('Emanet tutarı 0\'dan büyük olmalı', 400)

    const employer = await db.user.findUnique({ where: { id: employerId } })
    if (!employer) throw new ApiError('Kullanıcı bulunamadı', 404)

    if (employer.walletBalance < amount) {
      throw new ApiError(
        `Yetersiz bakiye. İşveren bakiyesi: ${employer.walletBalance.toLocaleString('tr-TR')}₺, Gerekli: ${amount.toLocaleString('tr-TR')}₺`,
        400
      )
    }

    const balanceAfter = employer.walletBalance - amount

    const [_, tx] = await db.$transaction([
      db.user.update({
        where: { id: employerId },
        data: { walletBalance: balanceAfter, walletUpdatedAt: new Date() },
      }),
      db.job.update({
        where: { id: jobId },
        data: {
          escrowAmount: amount,
          escrowStatus: 'HELD',
          escrowHeldAt: new Date(),
        },
      }),
      db.walletTransaction.create({
        data: {
          userId: employerId,
          type: 'FEE', // Emanet tutarı (FEE tipi negatif)
          amount: -amount,
          balanceAfter,
          description: `İş emaneti - ${amount.toLocaleString('tr-TR')}₺`,
          status: 'COMPLETED',
          jobId,
        },
      }),
    ])

    return { balanceAfter, escrowAmount: amount, transactionId: tx.id }
  }

  // İş tamamlandığında emaneti işçiye release et
  async releaseEscrow(params: {
    jobId: string
    workerId: string
    employerId: string
    amount: number
  }): Promise<any> {
    const { jobId, workerId, employerId, amount } = params

    const job = await db.job.findUnique({ where: { id: jobId } })
    if (!job) throw new ApiError('İş bulunamadı', 404)
    if (job.escrowStatus !== 'HELD') throw new ApiError('Emanet tutulu değil', 400)

    const worker = await db.user.findUnique({ where: { id: workerId } })
    if (!worker) throw new ApiError('İşçi bulunamadı', 404)

    const workerBalanceAfter = worker.walletBalance + amount

    const [_, __, workerTx] = await db.$transaction([
      db.job.update({
        where: { id: jobId },
        data: {
          escrowStatus: 'RELEASED',
          escrowReleasedAt: new Date(),
        },
      }),
      db.user.update({
        where: { id: workerId },
        data: { walletBalance: workerBalanceAfter, walletUpdatedAt: new Date() },
      }),
      db.walletTransaction.create({
        data: {
          userId: workerId,
          type: 'JOB_PAYMENT',
          amount,
          balanceAfter: workerBalanceAfter,
          description: `İş ücreti - ${job.title}`,
          status: 'COMPLETED',
          jobId,
          counterpartyId: employerId,
        },
      }),
    ])

    await createNotification({
      userId: workerId,
      type: 'WALLET_DEPOSIT',
      title: 'İş Ücreti Alındı 💰',
      body: `${amount.toLocaleString('tr-TR')}₺ iş ücreti cüzdanınıza yüklendi. Yeni bakiye: ${workerBalanceAfter.toLocaleString('tr-TR')}₺`,
    })

    return { workerBalanceAfter, transactionId: workerTx.id }
  }

  // İş iptal/ihtilaf durumunda emaneti işverene iade et
  async refundEscrow(params: {
    jobId: string
    employerId: string
    amount: number
    reason: string
  }): Promise<any> {
    const { jobId, employerId, amount, reason } = params

    const job = await db.job.findUnique({ where: { id: jobId } })
    if (!job) throw new ApiError('İş bulunamadı', 404)
    if (job.escrowStatus !== 'HELD' && job.escrowStatus !== 'DISPUTED') {
      throw new ApiError('Emanet tutulu değil veya zaten çözülmüş', 400)
    }

    const employer = await db.user.findUnique({ where: { id: employerId } })
    if (!employer) throw new ApiError('İşveren bulunamadı', 404)

    const balanceAfter = employer.walletBalance + amount

    const [_, tx] = await db.$transaction([
      db.job.update({
        where: { id: jobId },
        data: {
          escrowStatus: 'REFUNDED',
          escrowRefundedAt: new Date(),
        },
      }),
      db.user.update({
        where: { id: employerId },
        data: { walletBalance: balanceAfter, walletUpdatedAt: new Date() },
      }),
      db.walletTransaction.create({
        data: {
          userId: employerId,
          type: 'REFUND',
          amount,
          balanceAfter,
          description: `Emanet iadesi - ${job.title} (${reason})`,
          status: 'COMPLETED',
          jobId,
        },
      }),
    ])

    await createNotification({
      userId: employerId,
      type: 'WALLET_DEPOSIT',
      title: 'Emanet İade Edildi 💰',
      body: `${amount.toLocaleString('tr-TR')}₺ emanet tutarı cüzdanınıza iade edildi. Sebep: ${reason}`,
    })

    return { balanceAfter, transactionId: tx.id }
  }

  // Admin: ihtilaf çöz — emaneti işçiye ver veya işverene iade et
  async resolveEscrowDispute(params: {
    jobId: string
    adminId: string
    resolution: 'RELEASE_TO_WORKER' | 'REFUND_TO_EMPLOYER'
    note: string
  }): Promise<any> {
    const { jobId, adminId, resolution, note } = params

    const job = await db.job.findUnique({ where: { id: jobId } })
    if (!job) throw new ApiError('İş bulunamadı', 404)
    if (job.escrowStatus !== 'DISPUTED' && job.escrowStatus !== 'HELD') {
      throw new ApiError('Bu işin emaneti ihtilaf durumunda değil', 400)
    }

    // İşi DISPUTED yap
    await db.job.update({
      where: { id: jobId },
      data: { escrowStatus: 'DISPUTED' },
    })

    if (resolution === 'RELEASE_TO_WORKER') {
      // İşçiye ver — application'ı bul
      const app = await db.application.findFirst({
        where: { jobId, status: { in: ['IN_PROGRESS', 'COMPLETED'] } },
      })
      if (!app) throw new ApiError('Bu iş için aktif başvuru bulunamadı', 400)

      const result = await this.releaseEscrow({
        jobId,
        workerId: app.workerId,
        employerId: job.employerId,
        amount: job.escrowAmount,
      })

      // Audit log
      await db.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ESCROW_DISPUTE_RESOLVE',
          targetType: 'JOB',
          targetId: jobId,
          metadata: JSON.stringify({ resolution, note, amount: job.escrowAmount }),
        },
      })

      return { resolution: 'RELEASED_TO_WORKER', ...result }
    } else {
      // İşverene iade
      const result = await this.refundEscrow({
        jobId,
        employerId: job.employerId,
        amount: job.escrowAmount,
        reason: note,
      })

      await db.auditLog.create({
        data: {
          actorId: adminId,
          action: 'ESCROW_DISPUTE_RESOLVE',
          targetType: 'JOB',
          targetId: jobId,
          metadata: JSON.stringify({ resolution, note, amount: job.escrowAmount }),
        },
      })

      return { resolution: 'REFUNDED_TO_EMPLOYER', ...result }
    }
  }

  // İşçiyi DISPUTED yap (işveren veya admin)
  async markEscrowDisputed(params: {
    jobId: string
    reason: string
  }): Promise<any> {
    const { jobId, reason } = params

    const job = await db.job.findUnique({ where: { id: jobId } })
    if (!job) throw new ApiError('İş bulunamadı', 404)
    if (job.escrowStatus !== 'HELD') throw new ApiError('Emanet tutulu değil', 400)

    const updated = await db.job.update({
      where: { id: jobId },
      data: { escrowStatus: 'DISPUTED' },
    })

    // Her iki tarafa bildirim
    const app = await db.application.findFirst({
      where: { jobId, status: { in: ['IN_PROGRESS', 'COMPLETED'] } },
    })

    if (app) {
      await createNotification({
        userId: app.workerId,
        type: 'ESCROW_DISPUTED',
        title: 'İş İhtilafı ⚠️',
        body: `"${job.title}" işi için ihtilaf bildirildi. Admin incelemesine alındı. Sebep: ${reason}`,
      })
    }

    await createNotification({
      userId: job.employerId,
      type: 'ESCROW_DISPUTED',
      title: 'İş İhtilafı ⚠️',
      body: `"${job.title}" işi için ihtilaf bildirildi. Admin incelemesine alındı. Sebep: ${reason}`,
    })

    // Admin'lere bildirim
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', isPermanentlyBanned: false, isSuspended: false },
      select: { id: true },
    })
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'ESCROW_DISPUTED',
        title: 'İş İhtilafı — İnceleme Gerekli ⚠️',
        body: `"${job.title}" işi için ihtilaf: ${reason}`,
        data: { jobId },
      })
    }

    return updated
  }
}


export const walletService = new WalletService()
