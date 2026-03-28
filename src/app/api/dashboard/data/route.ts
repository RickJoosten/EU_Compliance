import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");

    const where: any = {
      organizationId: session.user.organizationId,
    };
    if (year) where.year = parseInt(year, 10);

    const data = await prisma.dashboardData.findMany({
      where,
      orderBy: [{ category: "asc" }, { year: "asc" }],
    });

    const parsed = data.map((d) => ({
      id: d.id,
      category: d.category,
      year: d.year,
      data: JSON.parse(d.data),
      importedAt: d.importedAt,
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
