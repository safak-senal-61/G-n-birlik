/**
 * Admin kullanıcısını sıfırla + test flag'lerini opsiyonel temizle
 */
import { db } from '../src/lib/db'

async function main() {
  // Admin'i sıfırla
  await db.user.update({
    where: { email: 'admin@gunubirlik.com' },
    data: {
      isSuspended: false,
      suspendedUntil: null,
      suspensionReason: null,
      suspendedAt: null,
      suspendedById: null,
      isPermanentlyBanned: false,
      bannedAt: null,
      bannedReason: null,
      bannedById: null,
      flagCount: 0,
      warningCount: 0,
      lastFlagAt: null,
    },
  })
  console.log('✓ Admin kullanıcısı sıfırlandı')

  // Süspansiyon kayıtlarını sil (admin'e ait)
  await db.suspension.deleteMany({
    where: { userId: (await db.user.findUnique({ where: { email: 'admin@gunubirlik.com' } }))?.id },
  })
  console.log('✓ Admin süspansiyon kayıtları temizlendi')
}

main()
  .catch((e) => {
    console.error('Hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
