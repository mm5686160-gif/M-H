import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rawDbUrl = process.env.DATABASE_URL || '';
  const safeDbUrl = rawDbUrl.replace(/:([^:@]+)@/, ':***@');

  const result: any = {
    hasDatabaseUrl: Boolean(rawDbUrl),
    databaseUrlMasked: safeDbUrl,
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
    nextAuthUrl: process.env.NEXTAUTH_URL || null,
    nodeEnv: process.env.NODE_ENV,
  };

  try {
    const userCount = await prisma.user.count();
    result.userCount = userCount;

    const owner = await prisma.user.findUnique({
      where: { email: 'owner@erp.local' },
      select: { id: true, email: true, role: true, isActive: true, hashedPassword: true },
    });

    const rawDbUrl = process.env.DATABASE_URL || '';
    const isPooler = rawDbUrl.includes('pooler.supabase.com');
    const isDirect = rawDbUrl.includes('db.') && rawDbUrl.includes('.supabase.co');

    return NextResponse.json({
      status: 'ok',
      databaseConnected: true,
      userCount,
      ownerFound: Boolean(owner),
      connectionType: isPooler ? 'Supabase Connection Pooler (Correct)' : isDirect ? 'Supabase Direct Host (May fail in serverless)' : 'Other',
    });
  } catch (err: any) {
    const rawDbUrl = process.env.DATABASE_URL || '';
    const isDirect = rawDbUrl.includes('db.') && rawDbUrl.includes('.supabase.co');

    return NextResponse.json(
      {
        status: 'error',
        databaseConnected: false,
        error: err.message,
        hint: isDirect
          ? 'You are using the Supabase DIRECT URL which is IPv6 only and unreachable from Vercel functions. Please use the Supabase Pooler URL (aws-0-eu-west-1.pooler.supabase.com) with URL-encoded password (%24 instead of $).'
          : 'Database connection failed. Please verify DATABASE_URL and DIRECT_URL in Vercel settings.',
      },
      { status: 500 }
    );
  }
}
