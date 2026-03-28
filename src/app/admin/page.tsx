import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Users, TrendingUp } from "lucide-react";
import { ComplianceScoreCircle } from "@/components/shared/compliance-score-circle";
import Link from "next/link";

async function getAdminData() {
  const organizations = await prisma.organization.findMany({
    include: {
      users: true,
      complianceStatuses: true,
      organizationRegulations: {
        include: {
          regulation: {
            include: {
              requirementCategories: {
                include: {
                  requirements: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const totalUsers = await prisma.user.count();
  const totalOrgs = organizations.length;

  const orgsWithScores = organizations.map((org) => {
    // Get all requirement IDs for this org's regulations
    const allRequirementIds: string[] = [];
    for (const orgReg of org.organizationRegulations) {
      for (const cat of orgReg.regulation.requirementCategories) {
        for (const req of cat.requirements) {
          allRequirementIds.push(req.id);
        }
      }
    }

    const totalReqs = allRequirementIds.length;
    const compliantCount = org.complianceStatuses.filter(
      (cs) =>
        allRequirementIds.includes(cs.requirementId) &&
        cs.status === "COMPLIANT"
    ).length;

    const score = totalReqs > 0 ? Math.round((compliantCount / totalReqs) * 100) : 0;

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      sector: org.sector,
      employeeCount: org.employeeCount,
      userCount: org.users.length,
      complianceScore: score,
    };
  });

  const avgScore =
    orgsWithScores.length > 0
      ? Math.round(
          orgsWithScores.reduce((sum, o) => sum + o.complianceScore, 0) /
            orgsWithScores.length
        )
      : 0;

  return { organizations: orgsWithScores, totalUsers, totalOrgs, avgScore };
}

const sectorLabels: Record<string, string> = {
  GEMEENTE: "Gemeente",
  OVERHEID: "Overheid",
  ONDERWIJS: "Onderwijs",
  ZORG: "Zorg",
  FINANCIEEL: "Financieel",
  OVERIG: "Overig",
};

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const { organizations, totalUsers, totalOrgs, avgScore } =
    await getAdminData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#334155]">Admin Dashboard</h1>
        <p className="text-sm text-[#64748B]">
          Overzicht van alle organisaties en compliance
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F4E79]/10">
              <Building2 className="h-6 w-6 text-[#1F4E79]" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Organisaties</p>
              <p className="text-2xl font-bold text-[#334155]">{totalOrgs}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0D9488]/10">
              <Users className="h-6 w-6 text-[#0D9488]" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Gebruikers</p>
              <p className="text-2xl font-bold text-[#334155]">{totalUsers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#059669]/10">
              <TrendingUp className="h-6 w-6 text-[#059669]" />
            </div>
            <div>
              <p className="text-sm text-[#64748B]">Gem. Compliance Score</p>
              <ComplianceScoreCircle score={avgScore} size={56} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-[#334155]">
            Organisaties Overzicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead className="text-right">Medewerkers</TableHead>
                <TableHead>Compliance Score</TableHead>
                <TableHead className="text-right">Gebruikers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-[#64748B]"
                  >
                    Nog geen organisaties toegevoegd.
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="font-medium text-[#1F4E79] hover:underline"
                      >
                        {org.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-[#64748B]">
                      {sectorLabels[org.sector] || org.sector}
                    </TableCell>
                    <TableCell className="text-right text-[#64748B]">
                      {org.employeeCount ?? "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={org.complianceScore}
                          className="h-2 w-24"
                        />
                        <span className="text-sm font-medium text-[#334155]">
                          {org.complianceScore}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-[#64748B]">
                      {org.userCount}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
