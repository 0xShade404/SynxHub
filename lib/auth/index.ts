import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/database/prisma";

const devCredentialsEnabled =
  process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_CREDENTIALS_LOGIN === "true";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    // Financial-platform-appropriate session lifetime: sessions expire
    // after 12 hours regardless of activity, and are refreshed at most
    // once per hour of active use.
    maxAge: 12 * 60 * 60,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    ...(devCredentialsEnabled
      ? [
          Credentials({
            id: "dev-credentials",
            name: "Development login",
            credentials: {
              email: { label: "Email", type: "email" },
              password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
              const email = credentials?.email as string | undefined;
              const password = credentials?.password as string | undefined;
              if (!email || !password) return null;

              const user = await prisma.user.findUnique({ where: { email } });
              if (!user?.passwordHash) return null;

              const valid = await bcrypt.compare(password, user.passwordHash);
              if (!valid) return null;

              if (user.status !== "ACTIVE") return null;

              return { id: user.id, email: user.email, name: user.name, image: user.image };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      if (dbUser && dbUser.status !== "ACTIVE") {
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          token.uid = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.mfaEnabled = dbUser.mfaEnabled;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
        session.user.mfaEnabled = token.mfaEnabled as boolean;
      }
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (!user.email) return;
      const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
      await prisma.loginEvent.create({
        data: {
          userId: dbUser?.id,
          email: user.email,
          method: account?.provider === "dev-credentials" ? "CREDENTIALS" : "GOOGLE",
          success: true,
        },
      });
    },
  },
});
