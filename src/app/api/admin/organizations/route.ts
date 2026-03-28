import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json(organizations);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, sector, employeeCount } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Naam en slug zijn verplicht" },
        { status: 400 }
      );
    }

    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Slug is al in gebruik" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        slug,
        sector: sector || "OVERIG",
        employeeCount: employeeCount ? parseInt(employeeCount) : null,
      },
    });

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Fout bij aanmaken organisatie" },
      { status: 500 }
    );
  }
}
