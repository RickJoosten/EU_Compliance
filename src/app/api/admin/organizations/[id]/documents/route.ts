import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.complianceDocument.findMany({
    where: { organizationId: params.id },
    include: { regulation: { select: { id: true, name: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(documents);
}

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
    const { title, description, url, type, regulationId, isPublic } = body;

    if (!title || !url) {
      return NextResponse.json(
        { error: "Titel en URL zijn verplicht" },
        { status: 400 }
      );
    }

    const doc = await prisma.complianceDocument.create({
      data: {
        organizationId: params.id,
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
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const docId = request.nextUrl.searchParams.get("docId");
  if (!docId) {
    return NextResponse.json({ error: "docId is verplicht" }, { status: 400 });
  }

  try {
    await prisma.complianceDocument.delete({ where: { id: docId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Fout bij verwijderen document" },
      { status: 500 }
    );
  }
}
