import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { OrganizationDetailClient } from "./organization-detail-client";

export const dynamic = 'force-dynamic';
import { decrypt, maskSecret } from "@/lib/crypto";

async function getData(id: string) {
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          accounts: { select: { provider: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      domains: {
        orderBy: { createdAt: "asc" },
      },
      organizationRegulations: {
        include: { regulation: true },
      },
      complianceStatuses: {
        include: {
          requirement: {
            include: {
              category: {
                include: { regulation: true },
              },
            },
          },
        },
      },
      dashboardData: { orderBy: { importedAt: "desc" }, take: 10 },
      complianceDocuments: {
        include: { regulation: { select: { id: true, name: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!org) return null;

  const allRegulations = await prisma.regulation.findMany({
    where: { isActive: true },
    include: {
      requirementCategories: {
        include: {
          requirements: { orderBy: { sortOrder: "asc" } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  // Fetch action plan summary: parent ActionItems grouped by regulation
  const parentActions = await prisma.actionItem.findMany({
    where: {
      organizationId: id,
      parentId: null,
    },
    include: {
      regulation: { select: { id: true, name: true } },
      children: {
        select: { id: true, status: true },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Group by regulation
  const actionPlanMap: Record<
    string,
    {
      regulationName: string;
      tasks: { id: string; title: string; totalChildren: number; doneChildren: number }[];
    }
  > = {};

  for (const action of parentActions) {
    const regId = action.regulationId || "no-regulation";
    const regName = action.regulation?.name || "Overig";
    if (!actionPlanMap[regId]) {
      actionPlanMap[regId] = { regulationName: regName, tasks: [] };
    }
    actionPlanMap[regId].tasks.push({
      id: action.id,
      title: action.title,
      totalChildren: action.children.length,
      doneChildren: action.children.filter((c) => c.status === "DONE").length,
    });
  }

  const actionPlanData = Object.entries(actionPlanMap).map(([regId, data]) => ({
    regulationId: regId,
    regulationName: data.regulationName,
    tasks: data.tasks,
  }));

  return { org, allRegulations, actionPlanData };
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const data = await getData(params.id);
  if (!data) notFound();

  const { org, allRegulations, actionPlanData } = data;

  const assignedRegIds = org.organizationRegulations.map((or) => or.regulationId);

  // Build compliance overview
  const complianceMap: Record<string, string> = {};
  for (const cs of org.complianceStatuses) {
    complianceMap[cs.requirementId] = cs.status;
  }

  return (
    <OrganizationDetailClient
      org={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        sector: org.sector,
        employeeCount: org.employeeCount,
        primaryColor: org.primaryColor,
        logo: org.logo,
        complianceCenterEnabled: org.complianceCenterEnabled,
      }}
      users={org.users.map((u) => ({
        ...u,
        loginMethod: u.accounts.length > 0
          ? u.accounts.map((a) => a.provider === "azure-ad" ? "Microsoft" : a.provider === "google" ? "Google" : a.provider).join(", ")
          : "E-mail/wachtwoord",
      }))}
      domains={org.domains.map((d) => ({
        id: d.id,
        domain: d.domain,
        verified: d.verified,
        createdAt: d.createdAt.toISOString(),
      }))}
      autoProvisionSSO={org.autoProvisionSSO}
      assignedRegulationIds={assignedRegIds}
      allRegulations={allRegulations.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        category: r.category,
        requirementCategories: r.requirementCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          requirements: cat.requirements.map((req) => ({
            id: req.id,
            title: req.title,
            status: complianceMap[req.id] || "NOT_STARTED",
          })),
        })),
      }))}
      dashboardData={org.dashboardData.map((d) => ({
        id: d.id,
        category: d.category,
        year: d.year,
        importedAt: d.importedAt.toISOString(),
      }))}
      actionPlanData={actionPlanData}
      oauthInfo={{
        googleClientId: org.googleClientId || "",
        googleClientSecretMasked: org.googleClientSecret ? maskSecret(decrypt(org.googleClientSecret)) : "",
        azureAdClientId: org.azureAdClientId || "",
        azureAdClientSecretMasked: org.azureAdClientSecret ? maskSecret(decrypt(org.azureAdClientSecret)) : "",
        azureAdTenantId: org.azureAdTenantId || "",
      }}
      complianceDocs={org.complianceDocuments.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        url: d.url,
        type: d.type,
        regulationId: d.regulationId,
        regulationName: d.regulation?.name || null,
        isPublic: d.isPublic,
      }))}
    />
  );
}
