import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await prisma.organization.findUnique({
    where: { id: params.id },
    include: {
      users: true,
      organizationRegulations: {
        include: { regulation: true },
      },
      complianceStatuses: {
        include: {
          requirement: {
            include: {
              category: {
                include: { regulation: true },
              },
            },
          },
        },
      },
      dashboardData: { orderBy: { importedAt: "desc" } },
    },
  });

  if (!org) {
    return NextResponse.json(
      { error: "Organisatie niet gevonden" },
      { status: 404 }
    );
  }

  return NextResponse.json(org);
}

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
    const {
      name, slug, sector, employeeCount, primaryColor, logo,
      googleClientId, googleClientSecret,
      azureAdClientId, azureAdClientSecret, azureAdTenantId,
      complianceCenterEnabled,
    } = body;

    const data: Record<string, unknown> = {};

    // Standard org fields
    if (name) data.name = name;
    if (slug) data.slug = slug;
    if (sector) data.sector = sector;
    if (employeeCount !== undefined) data.employeeCount = employeeCount ? parseInt(employeeCount) : null;
    if (primaryColor !== undefined) data.primaryColor = primaryColor;
    if (logo !== undefined) data.logo = logo;

    // OAuth fields
    if (googleClientId !== undefined) data.googleClientId = googleClientId;
    if (googleClientSecret) data.googleClientSecret = encrypt(googleClientSecret);
    if (azureAdClientId !== undefined) data.azureAdClientId = azureAdClientId;
    if (azureAdClientSecret) data.azureAdClientSecret = encrypt(azureAdClientSecret);
    if (azureAdTenantId !== undefined) data.azureAdTenantId = azureAdTenantId;
    if (complianceCenterEnabled !== undefined) data.complianceCenterEnabled = complianceCenterEnabled;

    const org = await prisma.organization.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(org);
  } catch (error) {
    return NextResponse.json(
      { error: "Fout bij bijwerken organisatie" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.organization.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Fout bij verwijderen organisatie" },
      { status: 500 }
    );
  }
}
