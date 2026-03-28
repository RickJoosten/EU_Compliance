import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; catId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, guidance, evidenceType, priority, sortOrder } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: "Titel en beschrijving zijn verplicht" },
        { status: 400 }
      );
    }

    const requirement = await prisma.requirement.create({
      data: {
        categoryId: params.catId,
        title,
        description,
        guidance: guidance || null,
        evidenceType: evidenceType || "DOCUMENT",
        priority: priority || "MEDIUM",
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(requirement, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Fout bij aanmaken vereiste" },
      { status: 500 }
    );
  }
}
