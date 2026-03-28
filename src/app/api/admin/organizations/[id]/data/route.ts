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
    const { category, year, data } = body;

    if (!category || !year || !data) {
      return NextResponse.json(
        { error: "Categorie, jaar en data zijn verplicht" },
        { status: 400 }
      );
    }

    // Validate that data is valid JSON string
    let dataStr: string;
    if (typeof data === "string") {
      JSON.parse(data); // validate
      dataStr = data;
    } else {
      dataStr = JSON.stringify(data);
    }

    const dashboardData = await prisma.dashboardData.create({
      data: {
        organizationId: params.id,
        category,
        year: parseInt(year),
        data: dataStr,
        importedBy: (session.user as any).id || null,
      },
    });

    return NextResponse.json(dashboardData, { status: 201 });
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Ongeldige JSON data" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Fout bij importeren data" },
      { status: 500 }
    );
  }
}
