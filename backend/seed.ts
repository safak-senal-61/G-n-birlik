/**
 * Seed Script - Günübirlik İş Bulma Platformu
 * Örnek kullanıcılar, iş ilanları, başvurular ve mesajlaşma verisi oluşturur.
 *
 * GÜVENLİK: Gerçek bcrypt kullanır (12 rounds)
 * Production'a taşırken bu script'i çalıştırma - sadece test verisi için.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

// Gerçek bcrypt ile şifre hashleme
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 12)
}

async function main() {
  console.log('🧹 Mevcut veriler temizleniyor...')
  await db.notification.deleteMany()
  await db.message.deleteMany()
  await db.conversationParticipant.deleteMany()
  await db.conversation.deleteMany()
  await db.review.deleteMany()
  await db.savedJob.deleteMany()
  await db.application.deleteMany()
  await db.job.deleteMany()
  await db.user.deleteMany()

  console.log('👤 Kullanıcılar oluşturuluyor...')
  
  // İşverenler
  const employers = await Promise.all([
    db.user.create({
      data: {
        email: 'ahmet@insaat.com',
        phone: '+905321112233',
        password: hashPassword('123456'),
        fullName: 'Ahmet Yılmaz',
        role: 'EMPLOYER',
        companyName: 'Yılmaz İnşaat Ltd. Şti.',
        companyTaxId: '1234567890',
        isVerified: true,
        city: 'İstanbul',
        district: 'Kadıköy',
        latitude: 40.9904,
        longitude: 29.0291,
        address: 'Caferağa Mah. Moda Cad. No:42 Kadıköy/İstanbul',
        ratingAvg: 4.7,
        ratingCount: 23,
        bio: '15 yıllık deneyime sahip inşaat firması. Konut ve ticari proje uzmanı.',
      },
    }),
    db.user.create({
      data: {
        email: 'mehmet@restaurant.com',
        phone: '+905322223344',
        password: hashPassword('123456'),
        fullName: 'Mehmet Demir',
        role: 'EMPLOYER',
        companyName: 'Lezzet Durağı Restoran',
        companyTaxId: '0987654321',
        isVerified: true,
        city: 'İstanbul',
        district: 'Beşiktaş',
        latitude: 41.0422,
        longitude: 29.0083,
        address: 'Sinanpaşa Mah. Çarşı Cad. No:18 Beşiktaş/İstanbul',
        ratingAvg: 4.5,
        ratingCount: 18,
        bio: 'Boğaz manzaralı butik restoran. Türk ve dünya mutfağı.',
      },
    }),
    db.user.create({
      data: {
        email: 'ayse@temizlik.com',
        phone: '+905323334455',
        password: hashPassword('123456'),
        fullName: 'Ayşe Kaya',
        role: 'EMPLOYER',
        companyName: 'Parlak Temizlik Hizmetleri',
        companyTaxId: '5678901234',
        isVerified: false,
        city: 'İstanbul',
        district: 'Şişli',
        latitude: 41.0533,
        longitude: 28.9898,
        address: 'Mecidiyeköy Mah. Büyükdere Cad. No:120 Şişli/İstanbul',
        ratingAvg: 4.3,
        ratingCount: 12,
        bio: 'Ofis ve ev temizliği hizmetleri. Düzenli ve titiz çalışma.',
      },
    }),
    db.user.create({
      data: {
        email: 'osman@nakliyat.com',
        phone: '+905324445566',
        password: hashPassword('123456'),
        fullName: 'Osman Şahin',
        role: 'EMPLOYER',
        companyName: 'Hızlı Nakliyat',
        companyTaxId: '3456789012',
        isVerified: true,
        city: 'İstanbul',
        district: 'Bakırköy',
        latitude: 40.9781,
        longitude: 28.8720,
        address: 'Zuhuratbaba Mah. İzzettin Çalışlar Cad. No:55 Bakırköy/İstanbul',
        ratingAvg: 4.6,
        ratingCount: 31,
        bio: 'Evden eve nakliyat. Sigortalı taşıma garantisi.',
      },
    }),
  ])

  // İşçiler
  const workers = await Promise.all([
    db.user.create({
      data: {
        email: 'worker1@example.com',
        phone: '+905331112233',
        password: hashPassword('123456'),
        fullName: 'Mustafa Çelik',
        role: 'WORKER',
        city: 'İstanbul',
        district: 'Kadıköy',
        latitude: 40.9880,
        longitude: 29.0250,
        address: 'Caferağa Mah. Kadıköy/İstanbul',
        skills: JSON.stringify(['İnşaat işçisi', 'Boyacı', 'Tesisatçı']),
        experienceYears: 8,
        hourlyWageMin: 250,
        hourlyWageMax: 400,
        isAvailable: true,
        ratingAvg: 4.8,
        ratingCount: 15,
        bio: '8 yıllık inşaat işçisi. Boya, tesisat ve genel inşaat işleri.',
      },
    }),
    db.user.create({
      data: {
        email: 'worker2@example.com',
        phone: '+905332223344',
        password: hashPassword('123456'),
        fullName: 'Fatma Yıldız',
        role: 'WORKER',
        city: 'İstanbul',
        district: 'Beşiktaş',
        latitude: 41.0400,
        longitude: 29.0100,
        skills: JSON.stringify(['Aşçı', 'Garson', 'Bulaşıkçı']),
        experienceYears: 5,
        hourlyWageMin: 200,
        hourlyWageMax: 350,
        isAvailable: true,
        ratingAvg: 4.6,
        ratingCount: 22,
        bio: 'Restoran sektöründe 5 yıl deneyim. Aşçı yardımcısı ve garson.',
      },
    }),
    db.user.create({
      data: {
        email: 'worker3@example.com',
        phone: '+905333334455',
        password: hashPassword('123456'),
        fullName: 'Hüseyin Arslan',
        role: 'WORKER',
        city: 'İstanbul',
        district: 'Şişli',
        latitude: 41.0510,
        longitude: 28.9850,
        skills: JSON.stringify(['Temizlik', 'Bahçıvan', 'Genel işçi']),
        experienceYears: 3,
        hourlyWageMin: 180,
        hourlyWageMax: 280,
        isAvailable: true,
        ratingAvg: 4.4,
        ratingCount: 9,
        bio: 'Temizlik ve bahçe bakımı işleri. Düzenli ve titiz.',
      },
    }),
    db.user.create({
      data: {
        email: 'worker4@example.com',
        phone: '+905334445566',
        password: hashPassword('123456'),
        fullName: 'İbrahim Koç',
        role: 'WORKER',
        city: 'İstanbul',
        district: 'Bakırköy',
        latitude: 40.9770,
        longitude: 28.8700,
        skills: JSON.stringify(['Nakliyat', 'Hamal', 'Şoför']),
        experienceYears: 10,
        hourlyWageMin: 300,
        hourlyWageMax: 500,
        isAvailable: true,
        ratingAvg: 4.9,
        ratingCount: 41,
        bio: '10 yıllık hamal ve şoför. Ağır yük taşıma deneyimi.',
      },
    }),
    db.user.create({
      data: {
        email: 'worker5@example.com',
        phone: '+905335556677',
        password: hashPassword('123456'),
        fullName: 'Emre Aydın',
        role: 'WORKER',
        city: 'İstanbul',
        district: 'Maltepe',
        latitude: 40.9350,
        longitude: 29.1300,
        skills: JSON.stringify(['Elektrikçi', 'Montaj', 'Teknik servis']),
        experienceYears: 6,
        hourlyWageMin: 350,
        hourlyWageMax: 550,
        isAvailable: false,
        ratingAvg: 4.7,
        ratingCount: 18,
        bio: 'Elektrik teknisyeni. Montaj ve teknik servis işleri.',
      },
    }),
  ])

  // Admin
  await db.user.create({
    data: {
      email: 'admin@gunubirlik.com',
      password: hashPassword('admin123'),
      fullName: 'Sistem Yöneticisi',
      role: 'ADMIN',
      city: 'İstanbul',
      district: 'Şişli',
    },
  })

  console.log('📋 İş ilanları oluşturuluyor...')
  
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  
  const dayAfter = new Date()
  dayAfter.setDate(dayAfter.getDate() + 2)
  dayAfter.setHours(0, 0, 0, 0)

  const inThreeDays = new Date()
  inThreeDays.setDate(inThreeDays.getDate() + 3)
  inThreeDays.setHours(0, 0, 0, 0)

  const jobs = await Promise.all([
    db.job.create({
      data: {
        employerId: employers[0].id,
        title: 'İnşaat İşçisi Aranıyor (Günlük)',
        description: 'Kadıköy\'de devam eden konut inşaatımız için 5 katlı bina çalışmasında görevlendirilmek üzere 3 inşaat işçisi arıyoruz. Sigorta ve yemek verilecektir. Deneyimli adaylar tercih edilecektir.',
        category: 'INSAAT',
        requiredSkills: JSON.stringify(['İnşaat işçisi', 'Kalıpçı']),
        workDate: tomorrow,
        startTime: '08:00',
        endTime: '17:00',
        durationHours: 9,
        wageAmount: 2500,
        wageType: 'DAILY',
        currency: 'TRY',
        isWageNegotiable: true,
        city: 'İstanbul',
        district: 'Kadıköy',
        address: 'Caferağa Mah. Moda Cad.',
        latitude: 40.9904,
        longitude: 29.0291,
        locationNote: 'Moda sahile 5 dakika yürüme mesafesi.',
        openingsTotal: 3,
        openingsFilled: 0,
        status: 'OPEN',
        urgency: 'HIGH',
        viewCount: 42,
      },
    }),
    db.job.create({
      data: {
        employerId: employers[1].id,
        title: 'Garson Aranıyor (Akşam Vardiyası)',
        description: 'Beşiktaş\'taki restoranımız için akşam servisinde çalışacak garson arıyoruz. Cumartesi-Pazar yoğunluğu nedeniyle 2 gün çalışacaksınız. Yemek ve bahşiş dahildir.',
        category: 'RESTAURANT',
        requiredSkills: JSON.stringify(['Garson', 'Servis']),
        workDate: tomorrow,
        startTime: '17:00',
        endTime: '23:00',
        durationHours: 6,
        wageAmount: 1800,
        wageType: 'DAILY',
        currency: 'TRY',
        isWageNegotiable: false,
        city: 'İstanbul',
        district: 'Beşiktaş',
        address: 'Sinanpaşa Mah. Çarşı Cad.',
        latitude: 41.0422,
        longitude: 29.0083,
        locationNote: 'Beşiktaş iskele karşısı.',
        openingsTotal: 2,
        openingsFilled: 0,
        status: 'OPEN',
        urgency: 'URGENT',
        viewCount: 28,
      },
    }),
    db.job.create({
      data: {
        employerId: employers[2].id,
        title: 'Ofis Temizliği (Günlük)',
        description: 'Şişli Mecidiyeköy\'de 3 katlı ofisimizin genel temizliği için temizlik görevlisi arıyoruz. Sabah 9-17 arası çalışma. Temizlik malzemeleri firmamız tarafından sağlanır.',
        category: 'TEMIZLIK',
        requiredSkills: JSON.stringify(['Temizlik']),
        workDate: dayAfter,
        startTime: '09:00',
        endTime: '17:00',
        durationHours: 8,
        wageAmount: 1500,
        wageType: 'DAILY',
        currency: 'TRY',
        isWageNegotiable: false,
        city: 'İstanbul',
        district: 'Şişli',
        address: 'Mecidiyeköy Mah. Büyükdere Cad.',
        latitude: 41.0533,
        longitude: 28.9898,
        locationNote: 'Metrobüs Mecidiyeköy durağına 2 dk.',
        openingsTotal: 1,
        openingsFilled: 0,
        status: 'OPEN',
        urgency: 'NORMAL',
        viewCount: 15,
      },
    }),
    db.job.create({
      data: {
        employerId: employers[3].id,
        title: 'Ev Taşıma Hamalı (2 Kişi)',
        description: 'Bakırköy\'den Ataköy\'e 3+1 ev taşınması için 2 hamal arıyoruz. Ağır eşya (koltuk, beyaz eşya) için güçlü adaylar tercih edilir. Sigortalı taşıma.',
        category: 'NAKLIYE',
        requiredSkills: JSON.stringify(['Hamal', 'Nakliyat']),
        workDate: inThreeDays,
        startTime: '09:00',
        endTime: '15:00',
        durationHours: 6,
        wageAmount: 2000,
        wageType: 'DAILY',
        currency: 'TRY',
        isWageNegotiable: true,
        city: 'İstanbul',
        district: 'Bakırköy',
        address: 'Zuhuratbaba Mah.',
        latitude: 40.9781,
        longitude: 28.8720,
        locationNote: 'Asansörsüz bina, 3. kat.',
        openingsTotal: 2,
        openingsFilled: 0,
        status: 'OPEN',
        urgency: 'NORMAL',
        viewCount: 33,
      },
    }),
    db.job.create({
      data: {
        employerId: employers[0].id,
        title: 'Boyacı (İç Mekan)',
        description: 'Kadıköy\'de 120m² dairenin 2 oda 1 salon boyanması için boyacı arıyoruz. Boya malzemeleri tarafımızdan sağlanır. Deneyimli, işini titiz yapan ustalar arıyoruz.',
        category: 'INSAAT',
        requiredSkills: JSON.stringify(['Boyacı', 'Tesisatçı']),
        workDate: dayAfter,
        startTime: '08:30',
        endTime: '18:00',
        durationHours: 9.5,
        wageAmount: 3000,
        wageType: 'DAILY',
        currency: 'TRY',
        isWageNegotiable: true,
        city: 'İstanbul',
        district: 'Kadıköy',
        address: 'Fenerbahçe Mah.',
        latitude: 40.9870,
        longitude: 29.0360,
        locationNote: 'Fenerbahçe Parkı yakını.',
        openingsTotal: 1,
        openingsFilled: 0,
        status: 'OPEN',
        urgency: 'LOW',
        viewCount: 19,
      },
    }),
    db.job.create({
      data: {
        employerId: employers[1].id,
        title: 'Aşçı Yardımcısı (Hafta Sonu)',
        description: 'Cumartesi-Pazar yoğunluğu için aşçı yardımcısı arıyoruz. Mutfakta yemek hazırlık, bulaşık ve genel yardım işleri. Restoran deneyimi olan adaylar tercih edilir.',
        category: 'RESTAURANT',
        requiredSkills: JSON.stringify(['Aşçı', 'Bulaşıkçı']),
        workDate: tomorrow,
        startTime: '10:00',
        endTime: '22:00',
        durationHours: 12,
        wageAmount: 2500,
        wageType: 'DAILY',
        currency: 'TRY',
        isWageNegotiable: false,
        city: 'İstanbul',
        district: 'Beşiktaş',
        address: 'Sinanpaşa Mah.',
        latitude: 41.0430,
        longitude: 29.0070,
        openingsTotal: 1,
        openingsFilled: 0,
        status: 'OPEN',
        urgency: 'HIGH',
        viewCount: 22,
      },
    }),
  ])

  console.log('📝 Başvurular oluşturuluyor...')
  
  await db.application.create({
    data: {
      jobId: jobs[0].id, // İnşaat işçisi
      workerId: workers[0].id, // Mustafa Çelik
      status: 'ACCEPTED',
      message: '8 yıllık inşaat işçisiyim. Boya ve tesisat işlerine de girerim. Sigortalı çalışmak isterim.',
      respondedAt: new Date(),
    },
  })

  await db.application.create({
    data: {
      jobId: jobs[0].id,
      workerId: workers[2].id, // Hüseyin Arslan
      status: 'PENDING',
      message: 'Genel işçi olarak çalışabilirim. İnşaatta yardımcı olabilirim.',
    },
  })

  await db.application.create({
    data: {
      jobId: jobs[1].id, // Garson
      workerId: workers[1].id, // Fatma Yıldız
      status: 'ACCEPTED',
      message: '5 yıllık garson deneyimim var. Akşam vardiyasında çalışabilirim.',
      respondedAt: new Date(),
    },
  })

  await db.application.create({
    data: {
      jobId: jobs[3].id, // Hamal
      workerId: workers[3].id, // İbrahim Koç
      status: 'PENDING',
      message: '10 yıllık hamalım. Ağır yük taşıma deneyimim var.',
    },
  })

  console.log('💬 Mesajlaşma örnekleri oluşturuluyor...')
  
  const conversation = await db.conversation.create({
    data: {
      jobId: jobs[0].id,
      applicationId: (await db.application.findFirst({
        where: { jobId: jobs[0].id, workerId: workers[0].id }
      }))!.id,
      type: 'DIRECT',
    },
  })

  await db.conversationParticipant.createMany({
    data: [
      { conversationId: conversation.id, userId: employers[0].id },
      { conversationId: conversation.id, userId: workers[0].id },
    ],
  })

  await db.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderId: workers[0].id,
        content: 'Merhaba, ilanınızı gördüm. İnşaat işçisiyim, başvurumu yaptım.',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 60),
      },
      {
        conversationId: conversation.id,
        senderId: employers[0].id,
        content: 'Merhaba Mustafa, başvurunu inceledim. Deneyimin güzel görünüyor. Yarın sabah 08:00\'de adresimize gelebilir misin?',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
      },
      {
        conversationId: conversation.id,
        senderId: workers[0].id,
        content: 'Tamam, orada olacağım. Sigorta konusunda nasıl ilerleyeceğiz?',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
      },
      {
        conversationId: conversation.id,
        senderId: employers[0].id,
        content: 'İşe başladığın gün SGK bildirimi yapacağız, merak etme. Yemek de bizden.',
        type: 'TEXT',
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
      },
    ],
  })

  console.log('🔔 Bildirimler oluşturuluyor...')
  
  await db.notification.createMany({
    data: [
      {
        userId: employers[0].id,
        type: 'JOB_APPLIED',
        title: 'Yeni Başvuru',
        body: 'Mustafa Çelik "İnşaat İşçisi Aranıyor" ilanınıza başvurdu.',
        data: JSON.stringify({ jobId: jobs[0].id, workerId: workers[0].id }),
      },
      {
        userId: employers[0].id,
        type: 'JOB_APPLIED',
        title: 'Yeni Başvuru',
        body: 'Hüseyin Arslan "İnşaat İşçisi Aranıyor" ilanınıza başvurdu.',
        data: JSON.stringify({ jobId: jobs[0].id, workerId: workers[2].id }),
      },
      {
        userId: workers[0].id,
        type: 'APPLICATION_ACCEPTED',
        title: 'Başvurunuz Onaylandı!',
        body: 'Yılmaz İnşaat başvurunuzu onayladı. Yarın 08:00\'te adresinde olun.',
        data: JSON.stringify({ jobId: jobs[0].id }),
      },
      {
        userId: workers[0].id,
        type: 'NEW_MESSAGE',
        title: 'Yeni Mesaj',
        body: 'Ahmet Yılmaz: İşe başladığın gün SGK bildirimi yapacağız...',
        data: JSON.stringify({ conversationId: conversation.id }),
      },
      {
        userId: workers[1].id,
        type: 'APPLICATION_ACCEPTED',
        title: 'Başvurunuz Onaylandı!',
        body: 'Lezzet Durağı Restoran garson başvurunuzu onayladı.',
        data: JSON.stringify({ jobId: jobs[1].id }),
      },
    ],
  })

  console.log('\n✅ Seed tamamlandı!')
  console.log('\n📋 Test Hesapları:')
  console.log('  İşveren:  ahmet@insaat.com / 123456')
  console.log('  İşçi:     worker1@example.com / 123456')
  console.log('  Admin:    admin@gunubirlik.com / admin123')
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
