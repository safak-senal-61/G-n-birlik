/**
 * Demo veri oluştur: test mesajları + flag'ler + bir askıya alınmış kullanıcı
 */
import { db } from '../src/lib/db'
import { hashPassword } from '../src/server/lib/auth'
import {
  filterMessageContent,
  seedSystemRules,
} from '../src/server/services/moderation.service'

async function main() {
  console.log('Demo veri oluşturuluyor...')

  // 1. Sistem kurallarını seed et
  await seedSystemRules()
  console.log('✓ Sistem kuralları seed edildi')

  // 2. Test gönderen kullanıcı (worker)
  let sender = await db.user.findUnique({ where: { email: 'demo-spammer@example.com' } })
  if (!sender) {
    sender = await db.user.create({
      data: {
        email: 'demo-spammer@example.com',
        password: hashPassword('Demo123!456'),
        fullName: 'Demo Spam Kullanıcı',
        role: 'WORKER',
        emailVerified: true,
        city: 'İstanbul',
        district: 'Kadıköy',
      },
    })
    console.log('✓ Test kullanıcı oluşturuldu:', sender.email)
  } else {
    console.log('✓ Test kullanıcı zaten var:', sender.email)
  }

  // 3. Alıcı kullanıcı (employer)
  let recipient = await db.user.findUnique({ where: { email: 'demo-employer@example.com' } })
  if (!recipient) {
    recipient = await db.user.create({
      data: {
        email: 'demo-employer@example.com',
        password: hashPassword('Demo123!456'),
        fullName: 'Demo İşveren',
        role: 'EMPLOYER',
        emailVerified: true,
        city: 'İstanbul',
        district: 'Beşiktaş',
        companyName: 'Demo İnşaat A.Ş.',
      },
    })
    console.log('✓ Alıcı kullanıcı oluşturuldu:', recipient.email)
  } else {
    console.log('✓ Alıcı kullanıcı zaten var:', recipient.email)
  }

  // 4. Test mesajları (filtrelenecek içeriklerle)
  const testMessages = [
    'Merhaba, beni 0532 123 45 67 numarasından ara',
    'Mail adresim: test.user@gmail.com, oradan yaz',
    'Instagram: @benim_hesabim, takip et',
    'web sitem: www.isverenim.com',
    'IBAN: TR99 0001 2345 6789 0123 4567 89',
    'Adres: Caferağa Mah. Moda Cad. No:12 Kadıköy',
    'salak adam ne diyorsun',
    'aptal mısın sen',
    'aq ne iş var',
    'seni öldürürüm senin',
  ]

  // Konuşma oluştur
  let conversation = await db.conversation.findFirst({
    where: { type: 'DIRECT', participants: { some: { userId: sender.id } } },
  })
  if (!conversation) {
    conversation = await db.conversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: [{ userId: sender.id }, { userId: recipient.id }],
        },
      },
    })
  }

  // Sistem kurallarını al
  const customRules = await db.moderationRule.findMany({
    where: { isEnabled: true, isSystem: false },
  })

  let totalFlags = 0
  for (const msg of testMessages) {
    const filterResult = await filterMessageContent(msg, { customRules })

    const message = await db.message.create({
      data: {
        conversationId: conversation.id,
        senderId: sender.id,
        content: filterResult.shouldBlock
          ? '[Bu mesaj otomatik olarak engellendi]'
          : filterResult.filteredContent,
        originalContent: filterResult.hasViolations ? msg : null,
        isFiltered: filterResult.hasViolations,
        filterReasons: filterResult.hasViolations
          ? JSON.stringify(
              filterResult.violations.map((v) => ({
                type: v.type,
                severity: v.severity,
                matched: v.matchedText,
              }))
            )
          : null,
        type: 'TEXT',
        isAutoBlocked: filterResult.shouldBlock,
      },
    })

    if (filterResult.hasViolations) {
      for (const v of filterResult.violations) {
        await db.moderationFlag.create({
          data: {
            messageId: message.id,
            conversationId: conversation.id,
            senderId: sender.id,
            violationType: v.type,
            severity: v.severity,
            matchedText: v.matchedText,
          },
        })
        totalFlags++
      }
    }
  }

  // Kullanıcı istatistiklerini güncelle
  await db.user.update({
    where: { id: sender.id },
    data: {
      flagCount: totalFlags,
      lastFlagAt: new Date(),
    },
  })

  console.log(`✓ ${testMessages.length} mesaj oluşturuldu, ${totalFlags} flag yaratıldı`)

  // 5. Askıya alınmış bir test kullanıcı daha
  let banned = await db.user.findUnique({ where: { email: 'banned-user@example.com' } })
  if (!banned) {
    banned = await db.user.create({
      data: {
        email: 'banned-user@example.com',
        password: hashPassword('Demo123!456'),
        fullName: 'Banlanmış Kullanıcı',
        role: 'WORKER',
        emailVerified: true,
        city: 'Ankara',
        district: 'Çankaya',
        isPermanentlyBanned: true,
        bannedAt: new Date(Date.now() - 86400000),
        bannedReason: 'Çok sayıda küfür ve taciz içeren mesaj gönderimi',
        flagCount: 25,
        warningCount: 5,
      },
    })
    console.log('✓ Banlı kullanıcı oluşturuldu')
  }

  // 6. Askıya alınmış bir kullanıcı
  let suspended = await db.user.findUnique({ where: { email: 'suspended-user@example.com' } })
  if (!suspended) {
    suspended = await db.user.create({
      data: {
        email: 'suspended-user@example.com',
        password: hashPassword('Demo123!456'),
        fullName: 'Askıya Alınmış Kullanıcı',
        role: 'WORKER',
        emailVerified: true,
        city: 'İzmir',
        district: 'Karşıyaka',
        isSuspended: true,
        suspendedUntil: new Date(Date.now() + 3 * 86400000),
        suspendedAt: new Date(),
        suspensionReason: 'Telefon ve e-posta paylaşımı (5 LOW ihlal)',
        flagCount: 5,
        warningCount: 2,
      },
    })
    console.log('✓ Askıya alınmış kullanıcı oluşturuldu')
  }

  console.log('\n=== Demo veri özeti ===')
  console.log(`Toplam kullanıcı: ${await db.user.count()}`)
  console.log(`Toplam mesaj: ${await db.message.count()}`)
  console.log(`Toplam flag: ${await db.moderationFlag.count()}`)
  console.log(`Askıya alınmış: ${await db.user.count({ where: { isSuspended: true, isPermanentlyBanned: false } })}`)
  console.log(`Banlı: ${await db.user.count({ where: { isPermanentlyBanned: true } })}`)
  console.log(`Sistem kuralları: ${await db.moderationRule.count()}`)
}

main()
  .catch((e) => {
    console.error('Hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
