import bcrypt from 'bcryptjs'
import { db } from '../src/lib/db'

async function main() {
  const newPass = await bcrypt.hash('Admin123!', 12)
  const updated = await db.user.update({
    where: { email: 'admin@gunubirlik.com' },
    data: { password: newPass }
  })
  console.log(`✓ Admin şifresi güncellendi: ${updated.email}`)
  
  // Test login
  const ok = await bcrypt.compare('Admin123!', newPass)
  console.log(`  Login test: ${ok ? '✓ OK' : '❌ FAIL'}`)
  
  await db.$disconnect()
}
main().catch(console.error)
