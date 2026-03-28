import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { RegulationDetailClient } from "./regulation-detail-client";

async function getRegulationData(slug: string, organizationId: string) {
  const regulation = await prisma.regulation.findUnique({
    where: { slug },
    include: {
      requirementCategories: {
        include: {
          requirements: {
            include: {
              complianceStatuses: {
                where: { organizationId },
              },
              actionItems: {
                where: { organizationId },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      organizationRegulations: {
        where: { organizationId },
      },
    },
  });

  if (!regulation || regulation.organizationRegulations.length === 0) {
    return null;
  }

  return regulation;
}

export default async function RegulationDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const regulation = await getRegulationData(
    params.slug,
    session.user.organizationId
  );

  if (!regulation) {
    notFound();
  }

  const categories = regulation.requirementCategories.map((cat) => {
    const total = cat.requirements.length;
    const compliant = cat.requirements.filter((r) =>
      r.complianceStatuses.some((s) => s.status === "COMPLIANT")
    ).length;
    return {
      id: cat.id,
      name: cat.name,
      description: cat.description,
      score: total > 0 ? Math.round((compliant / total) * 100) : 0,
      total,
      compliant,
      requirements: cat.requirements.map((req) => {
        const cs = req.complianceStatuses[0];
        return {
          id: req.id,
          title: req.title,
          description: req.description,
          guidance: req.guidance,
          evidenceType: req.evidenceType,
          priority: req.priority,
          status: cs?.status || "NOT_STARTED",
          notes: cs?.notes || "",
          actionItemCount: req.actionItems.length,
        };
      }),
    };
  });

  const allReqs = categories.flatMap((c) => c.requirements);
  const totalReqs = allReqs.length;
  const compliantReqs = allReqs.filter(
    (r) => r.status === "COMPLIANT"
  ).length;
  const overallScore =
    totalReqs > 0 ? Math.round((compliantReqs / totalReqs) * 100) : 0;

  return (
    <RegulationDetailClient
      regulation={{
        id: regulation.id,
        name: regulation.name,
        slug: regulation.slug,
        description: regulation.description,
        authority: regulation.authority,
        category: regulation.category,
      }}
      categories={categories}
      overallScore={overallScore}
      isAdmin={
        session.user.role === "CLIENT_ADMIN" ||
        session.user.role === "ADMIN"
      }
    />
  );
}
