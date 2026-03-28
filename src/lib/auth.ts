import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AzureADProvider from "next-auth/providers/azure-ad";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/crypto";

// Base auth options used by getServerSession throughout the app.
// SSO providers are added dynamically per request in the route handler.
export const authOptions: NextAuthOptions = {
  // Note: PrismaAdapter removed to fix credentials login with JWT strategy.
  // The adapter conflicts with CredentialsProvider in NextAuth v4.
  // SSO account linking is handled manually in the signIn callback.
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Wachtwoord", type: "password" },
      },
      async authorize(credentials) {
        console.log("[AUTH] authorize called with email:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.log("[AUTH] Missing email or password");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { organization: true },
          });

          console.log("[AUTH] User found:", !!user, "Has password:", !!user?.password);

          if (!user || !user.password) return null;

          const isValid = await bcryptjs.compare(credentials.password, user.password);
          console.log("[AUTH] Password valid:", isValid);
          if (!isValid) return null;

          const result = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            organizationId: user.organizationId,
            organizationName: user.organization?.name,
            organizationSlug: user.organization?.slug,
          };
          console.log("[AUTH] Returning user:", result.email, result.role);
          return result;
        } catch (error) {
          console.error("[AUTH] Error in authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      const email = user.email;
      if (!email) return false;

      const domain = email.split("@")[1]?.toLowerCase();
      if (!domain) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { organization: true },
      });

      if (existingUser) return true;

      const orgDomain = await prisma.organizationDomain.findUnique({
        where: { domain },
        include: { organization: true },
      });

      if (!orgDomain) return "/login?error=NoOrganization";
      if (!orgDomain.organization.autoProvisionSSO) return "/login?error=SSODisabled";

      return true;
    },

    async jwt({ token, user, account, trigger }) {
      if (user) {
        if (account?.provider === "credentials") {
          token.role = (user as any).role;
          token.organizationId = (user as any).organizationId;
          token.organizationName = (user as any).organizationName;
          token.organizationSlug = (user as any).organizationSlug;
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { organization: true },
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.organizationId = dbUser.organizationId;
            token.organizationName = dbUser.organization?.name;
            token.organizationSlug = dbUser.organization?.slug;
          }
        }
      }

      if (trigger === "update" && token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: { organization: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.organizationId = dbUser.organizationId;
          token.organizationName = dbUser.organization?.name;
          token.organizationSlug = dbUser.organization?.slug;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).organizationName = token.organizationName;
        (session.user as any).organizationSlug = token.organizationSlug;
      }
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      if (!user.email) return;

      const domain = user.email.split("@")[1]?.toLowerCase();
      if (!domain) return;

      const orgDomain = await prisma.organizationDomain.findUnique({
        where: { domain },
        include: { organization: true },
      });

      if (orgDomain && orgDomain.organization.autoProvisionSSO) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            organizationId: orgDomain.organizationId,
            role: "CLIENT_USER",
          },
        });
      }
    },
  },

  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "revact-comply-secret-key-change-in-production",
};

/**
 * Build auth options with SSO providers for a specific organization.
 * Called by the NextAuth route handler based on the sso_org cookie.
 */
export async function buildAuthOptionsForOrg(orgSlug: string): Promise<NextAuthOptions> {
  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
  });

  if (!org) return authOptions;

  const providers = [...authOptions.providers];

  if (org.googleClientId && org.googleClientSecret) {
    providers.push(
      GoogleProvider({
        clientId: org.googleClientId,
        clientSecret: decrypt(org.googleClientSecret),
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  if (org.azureAdClientId && org.azureAdClientSecret && org.azureAdTenantId) {
    providers.push(
      AzureADProvider({
        clientId: org.azureAdClientId,
        clientSecret: decrypt(org.azureAdClientSecret),
        tenantId: org.azureAdTenantId,
        allowDangerousEmailAccountLinking: true,
      })
    );
  }

  return {
    ...authOptions,
    providers,
  };
}
