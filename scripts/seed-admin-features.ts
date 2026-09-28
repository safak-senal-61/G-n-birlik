/**
 * Demo veri: pending job, payment ve verification talepleri
 */
import { db } from '../src/lib/db'
import { hashPassword } from '../src/server/lib/auth'

async function main() {
  console.log('Demo veri oluşturuluyor (jobs/payments/verifications)...')

  // 1. Onaysız bir işveren bul (veya oluştur)
  let employer = await db.user.findFirst({
    where: { role: 'EMPLOYER', isVerified: false },
  })
  if (!employer) {
    employer = await db.user.create({
      data: {
        email: 'pending-employer@example.com',
        password: hashPassword('Demo123!'),
        fullName: 'Bekleyen İşveren',
        role: 'EMPLOYER',
        emailVerified: true,
        city: 'İstanbul',
        district: 'Maltepe',
        companyName: 'Yeni Firma A.Ş.',
        isVerified: false,
      },
    })
    console.log('✓ Onaysız işveren oluşturuldu:', employer.email)
  }

  // 2. Onaylı bir işveren bul (veya oluştur)
  let verifiedEmployer = await db.user.findFirst({
    where: { role: 'EMPLOYER', isVerified: true, email: { not: 'admin@gunubirlik.com' } },
  })
  if (!verifiedEmployer) {
    verifiedEmployer = await db.user.findFirst({
      where: { email: 'ahmet@insaat.com' },
    })
  }
  if (!verifiedEmployer) {
    verifiedEmployer = await db.user.create({
      data: {
        email: 'verified-employer@example.com',
        password: hashPassword('Demo123!'),
        fullName: 'Onaylı İşveren Mehmet',
        role: 'EMPLOYER',
        emailVerified: true,
        city: 'İstanbul',
        district: 'Kadıköy',
        companyName: 'Mehmet İnşaat Ltd.',
        isVerified: true,
      },
    })
    console.log('✓ Onaylı işveren oluşturuldu:', verifiedEmployer.email)
  }

  // 3. Bir işçi bul
  let worker = await db.user.findFirst({
    where: { role: 'WORKER' },
  })
  if (!worker) {
    worker = await db.user.create({
      data: {
        email: 'demo-worker@example.com',
        password: hashPassword('Demo123!'),
        fullName: 'Demo İşçi',
        role: 'WORKER',
        emailVerified: true,
        city: 'İstanbul',
        district: 'Kadıköy',
      },
    })
    console.log('✓ İşçi oluşturuldu:', worker.email)
  }

  // 4. PENDING onay bekleyen iş ilanları (farklı kategorilerde)
  const pendingJobsData = [
    { title: 'Acil İnşaat İşçisi Aranıyor', category: 'INSAAT', wage: 1800, urgency: 'HIGH' },
    { title: 'Hafta Sonu Garson - Restaurant', category: 'RESTAURANT', wage: 1200, urgency: 'NORMAL' },
    { title: 'Ev Temizlik Elemanı', category: 'TEMIZLIK', wage: 900, urgency: 'NORMAL' },
    { title: 'Acil Nakliyat Hamalı (2 Kişi)', category: 'NAKLIYE', wage: 1500, urgency: 'URGENT' },
  ]

  for (const data of pendingJobsData) {
    const exists = await db.job.findFirst({
      where: { title: data.title, approvalStatus: 'PENDING' },
    })
    if (exists) continue

    await db.job.create({
      data: {
        employerId: employer.id,
        title: data.title,
        description: `${data.title} - Acil ihtiyaç vardır. Deneyimli adaylar tercih edilecektir. Lütfen başvuru yaparken deneyiminizi belirtin.`,
        category: data.category,
        workDate: new Date(Date.now() + 7 * 86400000),
        startTime: '08:00',
        endTime: '17:00',
        durationHours: 9,
        wageAmount: data.wage,
        wageType: 'DAILY',
        city: 'İstanbul',
        district: ['Kadıköy', 'Beşiktaş', 'Maltepe', 'Şişli'][Math.floor(Math.random() * 4)],
        latitude: 40.99,
        longitude: 29.02,
        openingsTotal: 2,
        status: 'OPEN',
        urgency: data.urgency,
        approvalStatus: 'PENDING',
      },
    })
  }
  console.log('✓ 4 adet PENDING iş ilanı oluşturuldu')

  // 5. Bir tamamlanmış iş + ödeme talebi
  let completedApp = await db.application.findFirst({
    where: { status: 'COMPLETED' },
  })
  if (!completedApp) {
    // Onaylı işverenin bir iş ilanı oluştur
    const job = await db.job.create({
      data: {
        employerId: verifiedEmployer.id,
        title: 'Tamamlanmış Test İşi',
        description: 'Bu iş tamamlanmış bir test işidir',
        category: 'INSAAT',
        workDate: new Date(Date.now() - 86400000),
        startTime: '08:00',
        endTime: '17:00',
        durationHours: 9,
        wageAmount: 2000,
        wageType: 'DAILY',
        city: 'İstanbul',
        district: 'Kadıköy',
        latitude: 40.99,
        longitude: 29.02,
        openingsTotal: 1,
        openingsFilled: 1,
        status: 'FILLED',
        urgency: 'NORMAL',
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
      },
    })
    completedApp = await db.application.create({
      data: {
        jobId: job.id,
        workerId: worker.id,
        status: 'COMPLETED',
        completedAt: new Date(),
        message: 'Test başvuru',
      },
    })
  }

  // Ödeme oluştur (PENDING)
  const existingPayment = await db.payment.findFirst({
    where: { applicationId: completedApp.id },
  })
  if (!existingPayment) {
    const job = await db.job.findUnique({ where: { id: completedApp.jobId } })
    if (job) {
      await db.payment.create({
        data: {
          applicationId: completedApp.id,
          jobId: job.id,
          workerId: completedApp.workerId,
          employerId: job.employerId,
          amount: job.wageAmount,
          wageType: job.wageType,
          status: 'PENDING',
        },
      })
      console.log('✓ PENDING ödeme talebi oluşturuldu')
    }
  }

  // 6. Birden fazla ödeme talebi (farklı durumlar)
  const paymentStatuses = ['PENDING', 'APPROVED', 'DISPUTED'] as const
  for (const ps of paymentStatuses) {
    const count = await db.payment.count({ where: { status: ps } })
    if (count >= 2) continue

    // Ek iş oluştur
    const extraJob = await db.job.create({
      data: {
        employerId: verifiedEmployer.id,
        title: `Ek Test İşi (${ps})`,
        description: `Bu ${ps} durumlu ödeme için test işidir`,
        category: 'TEMIZLIK',
        workDate: new Date(Date.now() - 2 * 86400000),
        startTime: '09:00',
        endTime: '16:00',
        durationHours: 7,
        wageAmount: 1200 + Math.floor(Math.random() * 800),
        wageType: 'DAILY',
        city: 'İstanbul',
        district: 'Beşiktaş',
        latitude: 41.04,
        longitude: 29.01,
        openingsTotal: 1,
        openingsFilled: 1,
        status: 'FILLED',
        urgency: 'NORMAL',
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
      },
    })
    const extraApp = await db.application.create({
      data: {
        jobId: extraJob.id,
        workerId: worker.id,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })
    await db.payment.create({
      data: {
        applicationId: extraApp.id,
        jobId: extraJob.id,
        workerId: worker.id,
        employerId: verifiedEmployer.id,
        amount: extraJob.wageAmount,
        wageType: extraJob.wageType,
        status: ps,
        ...(ps === 'APPROVED' && { adminApprovedAt: new Date() }),
        ...(ps === 'DISPUTED' && {
          disputedAt: new Date(),
          disputedById: worker.id,
          disputeReason: 'Ödeme yapılmadı, işveren ulaşılabilir değil',
        }),
      },
    })
  }
  console.log('✓ Farklı durumlarda ödeme talepleri oluşturuldu')

  // 7. Doğrulama talepleri (PENDING)
  const verifTypes = ['COMPANY', 'TAX', 'IDENTITY'] as const
  for (const type of verifTypes) {
    const exists = await db.verificationRequest.findFirst({
      where: { userId: employer.id, type, status: 'PENDING' },
    })
    if (exists) continue
    await db.verificationRequest.create({
      data: {
        userId: employer.id,
        type,
        documentUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...',
        documentNote: `${type} belgem ekte yer almaktadır, onayınızı rica ederim.`,
        status: 'PENDING',
      },
    })
  }
  console.log('✓ 3 adet PENDING doğrulama talebi oluşturuldu')

  // Özet
  console.log('\n=== ÖZET ===')
  console.log(`PENDING iş ilanları: ${await db.job.count({ where: { approvalStatus: 'PENDING' } })}`)
  console.log(`PENDING ödemeler: ${await db.payment.count({ where: { status: 'PENDING' } })}`)
  console.log(`APPROVED ödemeler: ${await db.payment.count({ where: { status: 'APPROVED' } })}`)
  console.log(`DISPUTED ödemeler: ${await db.payment.count({ where: { status: 'DISPUTED' } })}`)
  console.log(`PENDING doğrulamalar: ${await db.verificationRequest.count({ where: { status: 'PENDING' } })}`)
}

main()
  .catch((e) => {
    console.error('Hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
