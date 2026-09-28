import { db } from '../src/lib/db'

async function main() {
  const users = await db.user.findMany({
    select: { id: true, email: true, role: true, fullName: true, isSuspended: true, isPermanentlyBanned: true, password: true },
    take: 20
  })
  console.log('Users in DB:')
  for (const u of users) {
    console.log(`  ${u.email} (${u.role}) — suspended=${u.isSuspended} banned=${u.isPermanentlyBanned} pass=${u.password ? 'Y' : 'N'}`)
  }
  
  const broadcasts = await db.broadcast.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, status: true, sentCount: true, createdAt: true, target: true, sendEmail: true, sendPush: true }
  })
  console.log('\nRecent broadcasts:')
  for (const b of broadcasts) {
    console.log(`  ${b.id} — ${b.title} — ${b.status} — target=${b.target} push=${b.sendPush} email=${b.sendEmail} sentCount=${b.sentCount}`)
  }
  
  const notifCount = await db.notification.count()
  console.log(`\nTotal notifications: ${notifCount}`)
  
  await db.$disconnect()
}
main().catch(console.error)
