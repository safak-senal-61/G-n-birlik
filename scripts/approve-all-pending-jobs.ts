/**
 * Tüm PENDING ilanları APPROVED yap
 */
import { db } from '../src/lib/db'

async function main() {
  const result = await db.job.updateMany({
    where: { approvalStatus: 'PENDING' },
    data: { approvalStatus: 'APPROVED', approvedAt: new Date() },
  })
  console.log(`✓ ${result.count} PENDING ilan APPROVED yapıldı`)

  const totalApproved = await db.job.count({ where: { approvalStatus: 'APPROVED' } })
  const totalPending = await db.job.count({ where: { approvalStatus: 'PENDING' } })
  console.log(`Toplam APPROVED: ${totalApproved}`)
  console.log(`Toplam PENDING: ${totalPending}`)
}

main()
  .catch((e) => {
    console.error('Hata:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
