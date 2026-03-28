import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateActionPlan,
  deleteActionPlan,
} from "@/lib/actions/generate-action-plan";

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
    const { regulationIds } = body as { regulationIds: string[] };
    const newIds = regulationIds ?? [];

    const currentLinks = await prisma.organizationRegulation.findMany({
      where: { organizationId: params.id },
      select: { regulationId: true },
    });
    const currentIds = currentLinks.map((l) => l.regulationId);

    const toAdd = newIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentIds.filter((id) => !newIds.includes(id));

    for (const regId of toRemove) {
      await deleteActionPlan(prisma, params.id, regId);
      await prisma.organizationRegulation.deleteMany({
        where: { organizationId: params.id, regulationId: regId },
      });
    }

    for (const regId of toAdd) {
      await prisma.organizationRegulation.create({
        data: {
          organizationId: params.id,
          regulationId: regId,
        },
      });
      await generateActionPlan(prisma, params.id, regId);
    }

    const updated = await prisma.organizationRegulation.findMany({
      where: { organizationId: params.id },
      include: { regulation: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating regulations:", error);
    return NextResponse.json(
      { error: "Fout bij bijwerken richtlijnen" },
      { status: 500 }
    );
  }
}
