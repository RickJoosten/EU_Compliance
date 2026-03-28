import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OrganizationsClient } from "./organizations-client";

async function getData() {
  const organizations = await prisma.organization.findMany({
    include: {
      users: { select: { id: true } },
      organizationRegulations: {
        include: {
          regulation: {
            include: {
              requirementCategories: {
                include: { requirements: { select: { id: true } } },
              },
            },
          },
        },
      },
      complianceStatuses: true,
    },
    orderBy: { name: "asc" },
  });

  return organizations.map((org) => {
    const allReqIds: string[] = [];
    for (const or of org.organizationRegulations) {
      for (const cat of or.regulation.requirementCategories) {
        for (const req of cat.requirements) {
          allReqIds.push(req.id);
        }
      }
    }
    const total = allReqIds.length;
    const compliant = org.complianceStatuses.filter(
      (cs) => allReqIds.includes(cs.requirementId) && cs.status === "COMPLIANT"
    ).length;

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      sector: org.sector,
      employeeCount: org.employeeCount,
      userCount: org.users.length,
      complianceScore: total > 0 ? Math.round((compliant / total) * 100) : 0,
    };
  });
}

export default async function OrganizationsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const organizations = await getData();

  return <OrganizationsClient organizations={organizations} />;
}
