/**
 * Admin kullanıcısı oluştur veya sıfırla
 */
import { db } from '../src/lib/db'
import { hashPassword } from '../src/server/lib/auth'

async function main() {
  const email = 'admin@gunubirlik.com'
  const password = 'Admin123!456'
  const fullName = 'Sistem Yöneticisi'

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    // Şifreyi sıfırla ve ADMIN yap
    await db.user.update({
      where: { id: existing.id },
      data: {
        role: 'ADMIN',
        emailVerified: true,
        password: hashPassword(password),
      },
    })
    console.log(`✓ Mevcut kullanıcı ADMIN olarak güncellendi: ${email}`)
    return
  }

  const user = await db.user.create({
    data: {
      email,
      password: hashPassword(password),
      fullName,
      role: 'ADMIN',
      emailVerified: true,
      isAvailable: false,
    },
  })

  console.log('✓ Admin kullanıcısı oluşturuldu:')
  console.log(`  Email: ${email}`)
  console.log(`  Şifre: ${password}`)
  console.log(`  ID:    ${user.id}`)
}

main()
  .catch((e) => {
    console.error('Hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
