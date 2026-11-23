import { NextResponse } from 'next/server';
import { prisma, getNormalizedDatabaseUrl } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rawDbUrl = process.env.DATABASE_URL || '';
  const safeRawDbUrl = rawDbUrl.replace(/:([^:@]+)@/, ':***@');
  const normalizedUrl = getNormalizedDatabaseUrl();
  const safeNormalizedDbUrl = normalizedUrl.replace(/:([^:@]+)@/, ':***@');

  try {
    const userCount = await prisma.user.count();
    const owner = await prisma.user.findUnique({
      where: { email: 'owner@erp.local' },
      select: { id: true, email: true, role: true, isActive: true, hashedPassword: true },
    });

    const isPooler = normalizedUrl.includes('pooler.supabase.com');

    return NextResponse.json({
      status: 'ok',
      databaseConnected: true,
      userCount,
      ownerFound: Boolean(owner),
      ownerActive: owner?.isActive ?? false,
      passwordMatchesNew: owner ? await bcrypt.compare('!Password123', owner.hashedPassword) : false,
      connectionType: isPooler ? 'Supabase Connection Pooler (Correct)' : 'Custom',
      rawDatabaseUrlMasked: safeRawDbUrl,
      effectiveDatabaseUrlMasked: safeNormalizedDbUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'error',
        databaseConnected: false,
        error: err.message,
        rawDatabaseUrlMasked: safeRawDbUrl,
        effectiveDatabaseUrlMasked: safeNormalizedDbUrl,
      },
      { status: 500 }
    );
  }
}
