import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const regulationId = searchParams.get("regulationId");
    const assignedToId = searchParams.get("assignedToId");
    const myActions = searchParams.get("myActions");

    const where: any = {
      organizationId: orgId,
      parentId: null,
    };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (regulationId) where.regulationId = regulationId;
    if (assignedToId) where.assignedToId = assignedToId;
    if (myActions === "true") {
      where.assignedToId = (session.user as any).id;
    }

    const assignedToSelect = {
      select: { id: true, name: true, email: true },
    };

    const actions = await prisma.actionItem.findMany({
      where,
      include: {
        assignedTo: assignedToSelect,
        children: {
          include: {
            assignedTo: assignedToSelect,
          },
          orderBy: { sortOrder: "asc" as const },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(actions);
  } catch (error) {
    console.error("Error fetching action items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orgId = (session.user as any).organizationId;
    if (!orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, parentId, regulationId, assignedToId, dueDate, priority } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (parentId) {
      const parentAction = await prisma.actionItem.findFirst({
        where: { id: parentId, organizationId: orgId },
      });
      if (!parentAction) {
        return NextResponse.json(
          { error: "Parent action not found or belongs to different organization" },
          { status: 400 }
        );
      }
    }

    const assignedToSelect = {
      select: { id: true, name: true, email: true },
    };

    const action = await prisma.actionItem.create({
      data: {
        organizationId: orgId,
        title,
        description: description || "",
        parentId: parentId || null,
        regulationId: regulationId || null,
        assignedToId: assignedToId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        status: "TODO",
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

    return NextResponse.json(action, { status: 201 });
  } catch (error) {
    console.error("Error creating action item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
