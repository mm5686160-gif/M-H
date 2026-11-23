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

    if (owner) {
      result.ownerFound = true;
      result.ownerRole = owner.role;
      result.ownerActive = owner.isActive;
      result.passwordMatchesNew = await bcrypt.compare('!Password123', owner.hashedPassword);
      result.passwordMatchesOld = await bcrypt.compare('Password123!', owner.hashedPassword);
    } else {
      result.ownerFound = false;
      const allUsers = await prisma.user.findMany({ select: { email: true } });
      result.availableEmails = allUsers.map(u => u.email);
    }
  } catch (err: any) {
    result.dbError = {
      name: err.name,
      message: err.message,
      code: err.code,
    };
  }

  return NextResponse.json(result);
}
