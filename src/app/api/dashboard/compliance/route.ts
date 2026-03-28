import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "CLIENT_ADMIN" && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { requirementId, status, notes } = body;

    if (!requirementId || !status) {
      return NextResponse.json(
        { error: "requirementId and status are required" },
        { status: 400 }
      );
    }

    const validStatuses = [
      "NOT_STARTED",
      "IN_PROGRESS",
      "UNDER_REVIEW",
      "COMPLIANT",
      "NON_COMPLIANT",
    ];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const complianceStatus = await prisma.complianceStatus.upsert({
      where: {
        organizationId_requirementId: {
          organizationId: session.user.organizationId,
          requirementId,
        },
      },
      update: {
        status,
        notes: notes ?? undefined,
        completedAt: status === "COMPLIANT" ? new Date() : null,
        reviewedBy:
          status === "COMPLIANT" || status === "NON_COMPLIANT"
            ? session.user.id
            : undefined,
      },
      create: {
        organizationId: session.user.organizationId,
        requirementId,
        status,
        notes: notes ?? undefined,
        completedAt: status === "COMPLIANT" ? new Date() : null,
        reviewedBy:
          status === "COMPLIANT" || status === "NON_COMPLIANT"
            ? session.user.id
            : undefined,
      },
    });

    return NextResponse.json(complianceStatus);
  } catch (error) {
    console.error("Error updating compliance status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
