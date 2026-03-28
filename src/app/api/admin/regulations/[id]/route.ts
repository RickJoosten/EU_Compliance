import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const regulation = await prisma.regulation.findUnique({
    where: { id: params.id },
    include: {
      requirementCategories: {
        include: { requirements: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!regulation) {
    return NextResponse.json(
      { error: "Richtlijn niet gevonden" },
      { status: 404 }
    );
  }

  return NextResponse.json(regulation);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, description, authority, effectiveDate, category, isActive } = body;

    const regulation = await prisma.regulation.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description && { description }),
        ...(authority && { authority }),
        ...(effectiveDate && { effectiveDate: new Date(effectiveDate) }),
        ...(category && { category }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(regulation);
  } catch (error) {
    return NextResponse.json(
      { error: "Fout bij bijwerken richtlijn" },
      { status: 500 }
    );
  }
}
