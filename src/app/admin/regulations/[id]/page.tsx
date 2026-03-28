import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { RegulationDetailClient } from "./regulation-detail-client";

export const dynamic = 'force-dynamic';

async function getData(id: string) {
  const regulation = await prisma.regulation.findUnique({
    where: { id },
    include: {
      requirementCategories: {
        include: {
          requirements: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!regulation) return null;

  return {
    id: regulation.id,
    name: regulation.name,
    slug: regulation.slug,
    description: regulation.description,
    authority: regulation.authority,
    officialReference: regulation.officialReference,
    effectiveDate: regulation.effectiveDate.toISOString().split("T")[0],
    transpositionDate: regulation.transpositionDate?.toISOString().split("T")[0] || null,
    scope: regulation.scope,
    applicableSectors: regulation.applicableSectors,
    sourceUrl: regulation.sourceUrl,
    penaltyInfo: regulation.penaltyInfo,
    category: regulation.category,
    isActive: regulation.isActive,
    requirementCategories: regulation.requirementCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      sortOrder: cat.sortOrder,
      requirements: cat.requirements.map((req) => ({
        id: req.id,
        title: req.title,
        description: req.description,
        guidance: req.guidance,
        evidenceType: req.evidenceType,
        priority: req.priority,
        sortOrder: req.sortOrder,
      })),
    })),
  };
}

export default async function RegulationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const regulation = await getData(params.id);
  if (!regulation) notFound();

  return <RegulationDetailClient regulation={regulation} />;
}
