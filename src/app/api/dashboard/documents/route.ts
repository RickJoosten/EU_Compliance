import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = (session.user as any).organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.complianceDocument.findMany({
    where: { organizationId: orgId },
    include: { regulation: { select: { id: true, name: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(documents);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = (session.user as any).organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, url, type, regulationId, isPublic } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: "Titel en URL zijn verplicht" },
        { status: 400 }
      );
    }

    const doc = await prisma.complianceDocument.create({
      data: {
        organizationId: orgId,
        title,
        description: description || "",
        url,
        type: type || "LINK",
        regulationId: regulationId || null,
        isPublic: isPublic !== false,
      },
      include: { regulation: { select: { id: true, name: true } } },
    });

    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json(
      { error: "Fout bij aanmaken document" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = (session.user as any).organizationId;
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const docId = request.nextUrl.searchParams.get("docId");
  if (!docId) {
    return NextResponse.json({ error: "docId is verplicht" }, { status: 400 });
  }

  // Verify the document belongs to the user's organization
  const doc = await prisma.complianceDocument.findFirst({
    where: { id: docId, organizationId: orgId },
  });

  if (!doc) {
    return NextResponse.json({ error: "Document niet gevonden" }, { status: 404 });
  }

  await prisma.complianceDocument.delete({ where: { id: docId } });
  return NextResponse.json({ success: true });
}
