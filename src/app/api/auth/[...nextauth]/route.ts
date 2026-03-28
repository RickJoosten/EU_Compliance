import NextAuth from "next-auth";
import { authOptions, buildAuthOptionsForOrg } from "@/lib/auth";
import { cookies } from "next/headers";

async function getOptions() {
  const cookieStore = cookies();
  const orgSlug = cookieStore.get("sso_org")?.value;

  return orgSlug
    ? await buildAuthOptionsForOrg(orgSlug)
    : authOptions;
}

async function handler(req: Request, ctx: { params: { nextauth: string[] } }) {
  const options = await getOptions();
  // @ts-ignore - NextAuth types don't perfectly match App Router
  return NextAuth(req, ctx, options);
}

export { handler as GET, handler as POST };
