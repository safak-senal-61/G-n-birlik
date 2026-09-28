import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser, ok, fail } from '@/server/lib/auth'
import { withErrorHandler } from '@/server/lib/route'
import { safeJsonParse } from '@/server/lib/auth'

// GET /api/v1/users/[id] - Herkese açık profil
export const GET = withErrorHandler(async (req: NextRequest, ctx: any) => {
  const { id } = await ctx.params
  const viewer = await getAuthUser(req)

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: viewer?.userId === id,
      avatarUrl: true,
      bio: true,
      role: true,
      city: true,
      district: true,
      skills: true,
      experienceYears: true,
      hourlyWageMin: true,
      hourlyWageMax: true,
      isAvailable: true,
      ratingAvg: true,
      ratingCount: true,
      companyName: true,
      companyTaxId: viewer?.userId === id,
      isVerified: true,
      lastActiveAt: true,
      createdAt: true,
    },
  })

  if (!user) return fail('Kullanıcı bulunamadı.', 404)

  const safe: any = { ...user }
  safe.skills = safeJsonParse<string[]>(user.skills, [])

  // İşveren ise ilanlarını getir
  if (user.role === 'EMPLOYER') {
    safe.recentJobs = await db.job.findMany({
      where: { employerId: id, status: { in: ['OPEN', 'FILLED'] } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        category: true,
        wageAmount: true,
        workDate: true,
        city: true,
        district: true,
        status: true,
      },
    })
  }

  // İşçi ise son değerlendirmeler
  if (user.role === 'WORKER') {
    safe.recentReviews = await db.review.findMany({
      where: { receiverId: id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        rating: true,
        comment: true,
        reviewType: true,
        createdAt: true,
        reviewer: { select: { fullName: true, companyName: true } },
      },
    })
  }

  return ok(safe)
})
