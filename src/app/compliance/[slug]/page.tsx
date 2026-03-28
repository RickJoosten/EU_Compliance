import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ComplianceCenterClient } from "./compliance-center-client";

export const dynamic = 'force-dynamic';

interface PageProps {
  params: { slug: string };
}

async function getData(slug: string) {
  const org = await prisma.organization.findUnique({
    where: { slug },
  });

  if (!org || !org.complianceCenterEnabled) return null;

  const orgRegulations = await prisma.organizationRegulation.findMany({
    where: { organizationId: org.id, isActive: true },
    include: {
      regulation: {
        include: {
          requirementCategories: {
            include: {
              requirements: {
                include: {
                  complianceStatuses: {
                    where: { organizationId: org.id },
                    select: {
                      status: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });

  // Calculate scores and build data
  let lastUpdated: Date | null = null;
  let totalRequirements = 0;
  let totalCompliant = 0;

  const regulations = orgRegulations.map((or) => {
    const reg = or.regulation;
    const allReqs = reg.requirementCategories.flatMap((c) => c.requirements);
    const total = allReqs.length;
    const compliant = allReqs.filter((r) =>
      r.complianceStatuses.some((s) => s.status === "COMPLIANT")
    ).length;
    const score = total > 0 ? Math.round((compliant / total) * 100) : 0;

    totalRequirements += total;
    totalCompliant += compliant;

    const categories = reg.requirementCategories.map((cat) => {
      const catTotal = cat.requirements.length;
      const catCompliant = cat.requirements.filter((r) =>
        r.complianceStatuses.some((s) => s.status === "COMPLIANT")
      ).length;
      const catScore = catTotal > 0 ? Math.round((catCompliant / catTotal) * 100) : 0;

      // Filter requirements for detail view: only show COMPLIANT, IN_PROGRESS, UNDER_REVIEW
      const visibleRequirements = cat.requirements
        .filter((r) => {
          const status = r.complianceStatuses[0]?.status || "NOT_STARTED";
          return ["COMPLIANT", "IN_PROGRESS", "UNDER_REVIEW"].includes(status);
        })
        .map((r) => ({
          id: r.id,
          title: r.title,
          status: r.complianceStatuses[0]?.status || "NOT_STARTED",
        }));

      // Track lastUpdated
      for (const r of cat.requirements) {
        for (const s of r.complianceStatuses) {
          if (!lastUpdated || s.updatedAt > lastUpdated) {
            lastUpdated = s.updatedAt;
          }
        }
      }

      return {
        id: cat.id,
        name: cat.name,
        score: catScore,
        total: catTotal,
        compliant: catCompliant,
        requirements: visibleRequirements,
      };
    });

    return {
      id: reg.id,
      name: reg.name,
      slug: reg.slug,
      authority: reg.authority,
      category: reg.category,
      officialReference: reg.officialReference,
      effectiveDate: reg.effectiveDate?.toISOString() || null,
      scope: reg.scope,
      score,
      total,
      compliant,
      categories,
    };
  });

  const overallScore =
    totalRequirements > 0
      ? Math.round((totalCompliant / totalRequirements) * 100)
      : 0;

  // Fetch public compliance documents
  const documents = await prisma.complianceDocument.findMany({
    where: {
      organizationId: org.id,
      isPublic: true,
    },
    include: {
      regulation: { select: { id: true, name: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  const docData = documents.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    url: d.url,
    type: d.type,
    regulationId: d.regulationId,
    regulationName: d.regulation?.name || null,
  }));

  return {
    org: {
      name: org.name,
      slug: org.slug,
      sector: org.sector,
      primaryColor: org.primaryColor || "#1F4E79",
      logo: org.logo,
    },
    overallScore,
    totalRequirements,
    totalCompliant,
    regulations,
    documents: docData,
    lastUpdated: lastUpdated ? (lastUpdated as Date).toISOString() : null,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
    select: { name: true, complianceCenterEnabled: true },
  });

  if (!org || !org.complianceCenterEnabled) {
    return { title: "Niet gevonden" };
  }

  return {
    title: `${org.name} — HR Compliance Center`,
    description: `Bekijk de EU HR compliance status van ${org.name}`,
  };
}

export default async function ComplianceCenterPage({ params }: PageProps) {
  const data = await getData(params.slug);
  if (!data) notFound();

  return (
    <ComplianceCenterClient
      org={data.org}
      overallScore={data.overallScore}
      totalRequirements={data.totalRequirements}
      totalCompliant={data.totalCompliant}
      regulations={data.regulations}
      documents={data.documents}
      lastUpdated={data.lastUpdated}
    />
  );
}
