import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgRegulations = await prisma.organizationRegulation.findMany({
      where: {
        organizationId: session.user.organizationId,
        isActive: true,
      },
      include: {
        regulation: {
          include: {
            requirementCategories: {
              include: {
                requirements: {
                  include: {
                    complianceStatuses: {
                      where: {
                        organizationId: session.user.organizationId,
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

    const regulations = orgRegulations.map((or) => {
      const reg = or.regulation;
      const allRequirements = reg.requirementCategories.flatMap(
        (c) => c.requirements
      );
      const totalReqs = allRequirements.length;
      const compliantCount = allRequirements.filter((r) =>
        r.complianceStatuses.some((s) => s.status === "COMPLIANT")
      ).length;
      const score = totalReqs > 0 ? Math.round((compliantCount / totalReqs) * 100) : 0;

      const categories = reg.requirementCategories.map((cat) => {
        const catTotal = cat.requirements.length;
        const catCompliant = cat.requirements.filter((r) =>
          r.complianceStatuses.some((s) => s.status === "COMPLIANT")
        ).length;
        return {
          id: cat.id,
          name: cat.name,
          score: catTotal > 0 ? Math.round((catCompliant / catTotal) * 100) : 0,
          total: catTotal,
          compliant: catCompliant,
        };
      });

      return {
        id: reg.id,
        name: reg.name,
        slug: reg.slug,
        description: reg.description,
        category: reg.category,
        officialReference: reg.officialReference,
        effectiveDate: reg.effectiveDate,
        transpositionDate: reg.transpositionDate,
        scope: reg.scope,
        sourceUrl: reg.sourceUrl,
        penaltyInfo: reg.penaltyInfo,
        score,
        totalRequirements: totalReqs,
        compliantRequirements: compliantCount,
        categories,
      };
    });

    return NextResponse.json(regulations);
  } catch (error) {
    console.error("Error fetching regulations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
