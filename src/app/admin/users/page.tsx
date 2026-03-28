import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersClient } from "./users-client";

async function getData() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      organization: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const organizations = await prisma.organization.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return {
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
    })),
    organizations,
  };
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/login");
  }

  const { users, organizations } = await getData();

  return <UsersClient users={users} organizations={organizations} />;
}
