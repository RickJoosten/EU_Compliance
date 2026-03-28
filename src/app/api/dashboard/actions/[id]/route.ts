import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const assignedToSelect = {
  select: { id: true, name: true, email: true },
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.actionItem.findFirst({
      where: {
        id: params.id,
        organizationId: orgId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Action item not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, description, dueDate, priority, status, assignedToId } = body;

    if (assignedToId !== undefined && assignedToId !== null) {
      const user = await prisma.user.findFirst({
        where: { id: assignedToId, organizationId: orgId },
      });
      if (!user) {
        return NextResponse.json(
          { error: "Assigned user not found in this organization" },
          { status: 400 }
        );
      }
    }

    const action = await prisma.actionItem.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(priority !== undefined && { priority }),
        ...(status !== undefined && { status }),
        ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      },
      include: {
        assignedTo: assignedToSelect,
        children: {
          include: {
            assignedTo: assignedToSelect,
          },
          orderBy: { sortOrder: "asc" as const },
        },
      },
    });

    return NextResponse.json(action);
  } catch (error) {
    console.error("Error updating action item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.actionItem.findFirst({
      where: {
        id: params.id,
        organizationId: orgId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Action item not found" },
        { status: 404 }
      );
    }

    await prisma.actionItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting action item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
