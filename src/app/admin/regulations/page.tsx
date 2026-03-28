import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RegulationsClient } from "./regulations-client";

export const dynamic = 'force-dynamic';

async function getData() {
  const regulations = await prisma.regulation.findMany({
    include: {
      requirementCategories: {
        include: { requirements: { select: { id: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  return regulations.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    category: r.category,
    authority: r.authority,
    officialReference: r.officialReference,
    effectiveDate: r.effectiveDate.toISOString(),
    scope: r.scope,
    isActive: r.isActive,
    requirementCount: r.requirementCategories.reduce(
      (sum, cat) => sum + cat.requirements.length,
      0
    ),
  }));
}

export default async function RegulationsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const regulations = await getData();

  return <RegulationsClient regulations={regulations} />;
}
