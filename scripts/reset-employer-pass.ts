import bcrypt from 'bcryptjs'
import { db } from '../src/lib/db'

async function main() {
  // Tüm employer şifrelerini "123456" yap
  const result = await db.user.updateMany({
    where: { role: 'EMPLOYER' },
    data: { password: await bcrypt.hash('123456', 12) }
  })
  console.log(`✓ ${result.count} employer şifresi "123456" olarak güncellendi`)
  
  // Worker şifreleri de
  const wResult = await db.user.updateMany({
    where: { role: 'WORKER' },
    data: { password: await bcrypt.hash('123456', 12) }
  })
  console.log(`✓ ${wResult.count} worker şifresi "123456" olarak güncellendi`)
  
  await db.$disconnect()
}
main().catch(console.error)
