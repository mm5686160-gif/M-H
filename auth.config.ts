import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'e9b28f80456c68b753de5a8947cf20f3a4798e3b123456789abcdef012345678',
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthPage = nextUrl.pathname.startsWith('/login');
      const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');
      const isPublicRoute = nextUrl.pathname.startsWith('/_next') ||
                            nextUrl.pathname.startsWith('/favicon.ico') ||
                            nextUrl.pathname.startsWith('/images');

      if (isPublicRoute || isApiAuthRoute) {
        return true;
      }

      if (isAuthPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL('/', nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false; // Redirects to signIn page
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as any;
      }
      return session;
    },
  },
  providers: [], // Configured with credentials in lib/auth.ts
};
