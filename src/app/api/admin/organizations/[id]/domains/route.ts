import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domains = await prisma.organizationDomain.findMany({
      where: { organizationId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(domains);
  } catch (error) {
    console.error("Error fetching domains:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domein is verplicht" }, { status: 400 });
    }

    // Validate domain format
    const domainClean = domain.trim().toLowerCase();
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(domainClean)) {
      return NextResponse.json({ error: "Ongeldig domeinformaat" }, { status: 400 });
    }

    // Check if domain already exists
    const existing = await prisma.organizationDomain.findUnique({
      where: { domain: domainClean },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Dit domein is al gekoppeld aan een organisatie" },
        { status: 409 }
      );
    }

    const orgDomain = await prisma.organizationDomain.create({
      data: {
        organizationId: params.id,
        domain: domainClean,
      },
    });

    return NextResponse.json(orgDomain, { status: 201 });
  } catch (error) {
    console.error("Error creating domain:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");

    if (!domainId) {
      return NextResponse.json({ error: "domainId is verplicht" }, { status: 400 });
    }

    const existing = await prisma.organizationDomain.findFirst({
      where: { id: domainId, organizationId: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Domein niet gevonden" }, { status: 404 });
    }

    await prisma.organizationDomain.delete({
      where: { id: domainId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting domain:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
