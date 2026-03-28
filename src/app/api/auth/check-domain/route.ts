import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is verplicht" }, { status: 400 });
    }

    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) {
      return NextResponse.json({ error: "Ongeldig e-mailadres" }, { status: 400 });
    }

    const orgDomain = await prisma.organizationDomain.findUnique({
      where: { domain },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            googleClientId: true,
            azureAdClientId: true,
            azureAdTenantId: true,
          },
        },
      },
    });

    if (!orgDomain) {
      // No matching org — still allow credential login
      return NextResponse.json({
        found: false,
        hasGoogle: false,
        hasMicrosoft: false,
      });
    }

    const org = orgDomain.organization;

    return NextResponse.json({
      found: true,
      organizationName: org.name,
      organizationSlug: org.slug,
      hasGoogle: !!(org.googleClientId),
      hasMicrosoft: !!(org.azureAdClientId && org.azureAdTenantId),
    });
  } catch (error) {
    console.error("Error checking domain:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
