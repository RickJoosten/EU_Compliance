import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const regulations = await prisma.regulation.findMany({
    include: {
      requirementCategories: {
        include: { requirements: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(regulations);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, description, authority, effectiveDate, category, isActive } = body;

    if (!name || !slug || !description || !authority || !effectiveDate) {
      return NextResponse.json(
        { error: "Alle verplichte velden moeten ingevuld zijn" },
        { status: 400 }
      );
    }

    const existing = await prisma.regulation.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Slug is al in gebruik" },
        { status: 400 }
      );
    }

    const regulation = await prisma.regulation.create({
      data: {
        name,
        slug,
        description,
        authority,
        effectiveDate: new Date(effectiveDate),
        category: category || "OVERIG",
        isActive: isActive !== false,
      },
    });

    return NextResponse.json(regulation, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Fout bij aanmaken richtlijn" },
      { status: 500 }
    );
  }
}
