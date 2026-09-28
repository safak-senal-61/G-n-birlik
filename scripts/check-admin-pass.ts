import bcrypt from 'bcryptjs'
import { db } from '../src/lib/db'

async function main() {
  const admin = await db.user.findUnique({
    where: { email: 'admin@gunubirlik.com' },
    select: { id: true, email: true, password: true, role: true, isSuspended: true, isPermanentlyBanned: true }
  })
  console.log('Admin:', admin)
  
  if (admin?.password) {
    console.log('\nPassword checks:')
    for (const pwd of ['123456', 'admin123', 'Admin123!', 'admin', 'password', 'Admin123']) {
      const match = await bcrypt.compare(pwd, admin.password)
      console.log(`  "${pwd}" → ${match}`)
    }
  }
  
  await db.$disconnect()
}
main().catch(console.error)
