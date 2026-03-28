import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, sortOrder } = body;

    if (!name || !description) {
      return NextResponse.json(
        { error: "Naam en beschrijving zijn verplicht" },
        { status: 400 }
      );
    }

    const category = await prisma.requirementCategory.create({
      data: {
        regulationId: params.id,
        name,
        description,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Fout bij aanmaken categorie" },
      { status: 500 }
    );
  }
}
