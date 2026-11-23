import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export function getNormalizedDatabaseUrl(): string {
  const defaultPoolerUrl =
    'postgresql://postgres.utidvsadjfekwkgnqaxv:mm5686160%242002@aws-0-eu-west-1.pooler.supabase.com:5432/postgres?sslmode=require';

  let url = process.env.DATABASE_URL || defaultPoolerUrl;

  // Supabase direct host is IPv6 only and unreachable from Vercel serverless functions.
  // Automatically switch to the IPv4 connection pooler.
  if (url.includes('db.utidvsadjfekwkgnqaxv.supabase.co')) {
    url = defaultPoolerUrl;
  }

  // Ensure password '$' is URL-encoded as '%24'
  if (url.includes('mm5686160$2002')) {
    url = url.replace('mm5686160$2002', 'mm5686160%242002');
  }

  // Ensure sslmode=require for Supabase
  if (url.includes('supabase.com') && !url.includes('sslmode=')) {
    url += url.includes('?') ? '&sslmode=require' : '?sslmode=require';
  }

  return url;
}

const dbUrl = getNormalizedDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
