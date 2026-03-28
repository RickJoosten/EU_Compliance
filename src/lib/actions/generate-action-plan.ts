import { PrismaClient } from "@prisma/client";

export async function generateActionPlan(
  prismaClient: PrismaClient,
  organizationId: string,
  regulationId: string,
  startDate: Date = new Date()
): Promise<number> {
  const templates = await prismaClient.actionTemplate.findMany({
    where: { regulationId },
    orderBy: { sortOrder: "asc" },
  });

  const parents = templates.filter((t) => !t.parentId);
  const childrenByParent = new Map<string, typeof templates>();
  for (const t of templates) {
    if (t.parentId) {
      const arr = childrenByParent.get(t.parentId) || [];
      arr.push(t);
      childrenByParent.set(t.parentId, arr);
    }
  }

  let totalCreated = 0;

  for (const parent of parents) {
    const parentItem = await prismaClient.actionItem.create({
      data: {
        organizationId,
        regulationId,
        title: parent.title,
        description: parent.description,
        priority: parent.priority,
        sortOrder: parent.sortOrder,
        isFromTemplate: true,
        status: "TODO",
        dueDate: addDays(startDate, parent.relativeDeadlineDays),
      },
    });
    totalCreated++;

    const children = childrenByParent.get(parent.id) || [];
    for (const child of children) {
      await prismaClient.actionItem.create({
        data: {
          organizationId,
          regulationId,
          parentId: parentItem.id,
          title: child.title,
          description: child.description,
          priority: child.priority,
          sortOrder: child.sortOrder,
          isFromTemplate: true,
          status: "TODO",
          dueDate: addDays(startDate, child.relativeDeadlineDays),
        },
      });
      totalCreated++;
    }
  }

  return totalCreated;
}

export async function deleteActionPlan(
  prismaClient: PrismaClient,
  organizationId: string,
  regulationId: string
): Promise<number> {
  // Delete children first to avoid FK issues with self-referential cascade in SQLite
  const deleted1 = await prismaClient.actionItem.deleteMany({
    where: { organizationId, regulationId, parentId: { not: null } },
  });
  const deleted2 = await prismaClient.actionItem.deleteMany({
    where: { organizationId, regulationId, parentId: null },
  });
  return deleted1.count + deleted2.count;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
