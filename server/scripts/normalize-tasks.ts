// One-time backfill: normalize legacy Task.status casing to the canonical set,
// default missing priority, and assign a stable `position` per user.
//
// Run once after `prisma db push` applies the new columns:
//   npx ts-node scripts/normalize-tasks.ts
// Idempotent — safe to run more than once.

import prisma from '../utils/prisma';
import {
  DEFAULT_PRIORITY,
  normalizePriority,
  normalizeStatus,
} from '../utils/taskConstants';

async function main() {
  const tasks = await prisma.task.findMany({ orderBy: [{ userId: 'asc' }, { id: 'asc' }] });
  console.log(`Found ${tasks.length} tasks to inspect.`);

  // position counter per user
  const posByUser = new Map<number, number>();
  let changed = 0;

  for (const t of tasks) {
    const status = normalizeStatus(t.status) ?? 'draft';
    const priority = normalizePriority(t.priority) ?? DEFAULT_PRIORITY;
    const pos = posByUser.get(t.userId) ?? 0;
    posByUser.set(t.userId, pos + 1);

    const needsUpdate =
      status !== t.status || priority !== t.priority || t.position !== pos;

    if (needsUpdate) {
      await prisma.task.update({
        where: { id: t.id },
        data: { status, priority, position: pos },
      });
      changed++;
    }
  }

  console.log(`Normalized ${changed} task(s).`);
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
