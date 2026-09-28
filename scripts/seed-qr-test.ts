/**
 * QR test verisi oluştur: işçi + ilan + başvuru (ACCEPTED durumunda)
 */
import { db } from '../src/lib/db'
import { hashPassword } from '../src/server/lib/auth'

async function main() {
  console.log('QR test verisi oluşturuluyor...')

  // İşçi bul/oluştur
  let worker = await db.user.findUnique({ where: { email: 'qr-test-worker@example.com' } })
  if (!worker) {
    worker = await db.user.create({
      data: {
        email: 'qr-test-worker@example.com',
        password: hashPassword('Worker123!'),
        fullName: 'QR Test İşçi',
        role: 'WORKER',
        emailVerified: true,
        city: 'İstanbul',
        district: 'Kadıköy',
      },
    })
    console.log('✓ İşçi oluşturuldu:', worker.email)
  } else {
    console.log('✓ İşçi zaten var:', worker.email)
  }

  // İşveren (onaylı)
  const employer = await db.user.findUnique({ where: { email: 'ahmet@insaat.com' } })
  if (!employer) {
    console.log('✗ İşveren bulunamadı')
    return
  }

  // Bir ilan bul (bu işverene ait)
  let job = await db.job.findFirst({
    where: { employerId: employer.id, status: 'OPEN' },
  })
  if (!job) {
    job = await db.job.create({
      data: {
        employerId: employer.id,
        title: 'QR Test İlanı',
        description: 'Bu ilan QR testi için oluşturulmuştur',
        category: 'INSAAT',
        workDate: new Date(Date.now() + 7 * 86400000),
        startTime: '08:00',
        endTime: '17:00',
        durationHours: 9,
        wageAmount: 2500,
        wageType: 'DAILY',
        city: 'İstanbul',
        district: 'Kadıköy',
        latitude: 40.99,
        longitude: 29.02,
        openingsTotal: 1,
        openingsFilled: 0,
        status: 'OPEN',
        urgency: 'NORMAL',
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
      },
    })
    console.log('✓ İlan oluşturuldu:', job.title)
  } else {
    console.log('✓ İlan bulundu:', job.title)
  }

  // ACCEPTED başvuru oluştur
  let app = await db.application.findFirst({
    where: { jobId: job.id, workerId: worker.id, status: 'ACCEPTED' },
  })
  if (!app) {
    // Eski başvuru varsa sil
    await db.application.deleteMany({ where: { jobId: job.id, workerId: worker.id } })
    app = await db.application.create({
      data: {
        jobId: job.id,
        workerId: worker.id,
        status: 'ACCEPTED',
        message: 'QR test başvurusu',
        respondedAt: new Date(),
      },
    })
    console.log('✓ ACCEPTED başvuru oluşturuldu:', app.id)
  } else {
    console.log('✓ ACCEPTED başvuru zaten var:', app.id)
  }

  console.log()
  console.log('=== Test Bilgileri ===')
  console.log(`İşveren: ahmet@insaat.com / Ahmet123!`)
  console.log(`İşçi: qr-test-worker@example.com / Worker123!`)
  console.log(`İlan: ${job.title} (${job.id})`)
  console.log(`Başvuru: ${app.id}`)
}

main()
  .catch((e) => {
    console.error('Hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
