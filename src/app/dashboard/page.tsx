import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
import { ComplianceScoreCircle } from "@/components/shared/compliance-score-circle";
import { StoplichtIndicator } from "@/components/shared/stoplicht-indicator";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import {
  ArrowRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";

async function getDashboardData(organizationId: string) {
  const orgRegulations = await prisma.organizationRegulation.findMany({
    where: { organizationId, isActive: true },
    include: {
      regulation: {
        include: {
          requirementCategories: {
            include: {
              requirements: {
                include: {
                  complianceStatuses: {
                    where: { organizationId },
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

  const regulations = orgRegulations.map((or) => {
    const reg = or.regulation;
    const allReqs = reg.requirementCategories.flatMap((c) => c.requirements);
    const total = allReqs.length;
    const compliant = allReqs.filter((r) =>
      r.complianceStatuses.some((s) => s.status === "COMPLIANT")
    ).length;
    const score = total > 0 ? Math.round((compliant / total) * 100) : 0;

    const categories = reg.requirementCategories.map((cat) => {
      const catTotal = cat.requirements.length;
      const catCompliant = cat.requirements.filter((r) =>
        r.complianceStatuses.some((s) => s.status === "COMPLIANT")
      ).length;
      return {
        name: cat.name,
        score: catTotal > 0 ? Math.round((catCompliant / catTotal) * 100) : 0,
      };
    });

    return {
      id: reg.id,
      name: reg.name,
      slug: reg.slug,
      score,
      total,
      compliant,
      categories,
    };
  });

  const allReqs = orgRegulations.flatMap((or) =>
    or.regulation.requirementCategories.flatMap((c) => c.requirements)
  );
  const totalAll = allReqs.length;
  const compliantAll = allReqs.filter((r) =>
    r.complianceStatuses.some((s) => s.status === "COMPLIANT")
  ).length;
  const overallScore =
    totalAll > 0 ? Math.round((compliantAll / totalAll) * 100) : 0;

  const actionItems = await prisma.actionItem.findMany({
    where: {
      organizationId,
      parentId: { not: null },
      status: { not: "DONE" },
    },
    include: {
      requirement: {
        include: {
          category: {
            include: {
              regulation: { select: { name: true } },
            },
          },
        },
      },
      assignedTo: {
        select: { id: true, name: true },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  });

  const recentStatuses = await prisma.complianceStatus.findMany({
    where: { organizationId },
    include: {
      requirement: {
        include: {
          category: {
            include: {
              regulation: { select: { name: true } },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  return { regulations, overallScore, actionItems, recentStatuses };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organizationId) {
    redirect("/login");
  }

  const { regulations, overallScore, actionItems, recentStatuses } =
    await getDashboardData(session.user.organizationId);

  const orgName = session.user.organizationName || "uw organisatie";
  const now = new Date();

  const overdueActions = actionItems.filter(
    (a) => a.dueDate && new Date(a.dueDate) < now && a.status !== "DONE"
  );
  const upcomingActions = actionItems.filter(
    (a) =>
      a.status !== "DONE" &&
      (!a.dueDate || new Date(a.dueDate) >= now)
  );

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#1F4E79] to-[#2E75B6] p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welkom bij {orgName}
        </h1>
        <p className="mt-1 text-blue-100">
          Beheer uw compliance status en volg uw voortgang op regelgeving.
        </p>
      </div>

      {/* Overall score + stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#64748B]">
              Totale Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pt-2">
            <ComplianceScoreCircle
              score={overallScore}
              size={130}
              label="Totaalscore"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#64748B]">
              Regelgevingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#334155]">
              {regulations.length}
            </div>
            <p className="text-sm text-[#64748B] mt-1">Actieve regelgevingen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#64748B]">
              Openstaande acties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#334155]">
              {actionItems.filter((a) => a.status !== "DONE").length}
            </div>
            {overdueActions.length > 0 && (
              <p className="text-sm text-[#DC2626] mt-1 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {overdueActions.length} achterstallig
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-[#64748B]">
              Recente wijzigingen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-[#334155]">
              {recentStatuses.length}
            </div>
            <p className="text-sm text-[#64748B] mt-1">Laatste updates</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-regulation cards */}
      <div>
        <h2 className="text-lg font-semibold text-[#334155] mb-4">
          Regelgeving Overzicht
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {regulations.map((reg) => (
            <Link
              key={reg.id}
              href={`/dashboard/regulations/${reg.slug}`}
              className="group"
            >
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base text-[#334155] group-hover:text-[#1F4E79] transition-colors">
                        {reg.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {reg.compliant} / {reg.total} vereisten compliant
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <StoplichtIndicator score={reg.score} />
                      <span className="text-lg font-bold text-[#334155]">
                        {reg.score}%
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {reg.categories.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#64748B] truncate mr-2">
                          {cat.name}
                        </span>
                        <span className="text-[#334155] font-medium shrink-0">
                          {cat.score}%
                        </span>
                      </div>
                      <Progress value={cat.score} className="h-1.5" />
                    </div>
                  ))}
                  <div className="pt-2 flex items-center text-xs text-[#2E75B6] font-medium group-hover:text-[#1F4E79]">
                    Bekijk details
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {regulations.length === 0 && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="py-12 text-center text-[#64748B]">
                Er zijn nog geen regelgevingen gekoppeld aan uw organisatie.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Bottom row: actions + recent changes */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Action items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Actie-items</CardTitle>
              <Link
                href="/dashboard/actions"
                className="text-sm text-[#2E75B6] hover:text-[#1F4E79] font-medium"
              >
                Bekijk alles
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {overdueActions.length === 0 && upcomingActions.length === 0 ? (
              <p className="text-sm text-[#64748B] py-4 text-center">
                Geen openstaande actie-items.
              </p>
            ) : (
              <div className="space-y-3">
                {overdueActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
                  >
                    <AlertTriangle className="h-4 w-4 text-[#DC2626] mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#334155]">
                        {action.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-[#DC2626]">
                          Deadline:{" "}
                          {action.dueDate
                            ? new Date(action.dueDate).toLocaleDateString("nl-NL")
                            : "—"}
                        </p>
                        <span className="text-xs text-[#64748B]">
                          {(action as any).assignedTo?.name || "Niet toegewezen"}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs bg-red-100 text-[#DC2626] border-red-300"
                    >
                      Achterstallig
                    </Badge>
                  </div>
                ))}
                {upcomingActions.map((action) => (
                  <div
                    key={action.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
                  >
                    <Clock className="h-4 w-4 text-[#64748B] mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#334155]">
                        {action.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-[#64748B]">
                          {action.dueDate
                            ? `Deadline: ${new Date(action.dueDate).toLocaleDateString("nl-NL")}`
                            : "Geen deadline"}
                        </p>
                        <span className="text-xs text-[#64748B]">
                          {(action as any).assignedTo?.name || "Niet toegewezen"}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-xs">
                      {action.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent changes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recente Wijzigingen</CardTitle>
          </CardHeader>
          <CardContent>
            {recentStatuses.length === 0 ? (
              <p className="text-sm text-[#64748B] py-4 text-center">
                Nog geen wijzigingen.
              </p>
            ) : (
              <div className="space-y-3">
                {recentStatuses.map((cs) => (
                  <div
                    key={cs.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 p-3"
                  >
                    <div className="mt-0.5">
                      {cs.status === "COMPLIANT" ? (
                        <CheckCircle2 className="h-4 w-4 text-[#059669]" />
                      ) : cs.status === "IN_PROGRESS" ? (
                        <TrendingUp className="h-4 w-4 text-[#2E75B6]" />
                      ) : (
                        <Clock className="h-4 w-4 text-[#64748B]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#334155] truncate">
                        {cs.requirement.title}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {cs.requirement.category.regulation.name}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={cs.status} />
                      <span className="text-xs text-[#64748B]">
                        {new Date(cs.updatedAt).toLocaleDateString("nl-NL")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
