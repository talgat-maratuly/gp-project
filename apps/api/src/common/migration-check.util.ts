import { readdirSync } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

export interface MigrationCheckResult {
  ok: boolean;
  applied: string[];
  expected: string[];
  pending: string[];
  orphanedInDb: string[];
  fixCommand: string | null;
  message: string;
}

function resolveMigrationsDir(): string {
  const candidates = [
    join(process.cwd(), 'prisma/migrations'),
    join(process.cwd(), 'apps/api/prisma/migrations'),
  ];
  for (const dir of candidates) {
    try {
      if (readdirSync(dir).some((n) => /^\d+_/.test(n))) return dir;
    } catch {
      /* try next */
    }
  }
  return candidates[0];
}

export async function checkPrismaMigrations(prisma: PrismaService): Promise<MigrationCheckResult> {
  const migrationsRoot = resolveMigrationsDir();
  let expected: string[] = [];
  try {
    expected = readdirSync(migrationsRoot)
      .filter((name) => /^\d+_/.test(name))
      .sort();
  } catch {
    return {
      ok: false,
      applied: [],
      expected: [],
      pending: [],
      orphanedInDb: [],
      fixCommand: 'npm run prisma:migrate:deploy',
      message: 'Папка migrations не найдена (запускайте API из корня monorepo)',
    };
  }

  let applied: string[] = [];
  try {
    const rows = await prisma.$queryRaw<{ migration_name: string }[]>`
      SELECT migration_name FROM "_prisma_migrations"
      WHERE rolled_back_at IS NULL
      ORDER BY finished_at ASC
    `;
    applied = rows.map((r) => r.migration_name);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      applied: [],
      expected,
      pending: expected,
      orphanedInDb: [],
      fixCommand: 'npm run prisma:migrate:deploy',
      message: `Таблица _prisma_migrations недоступна: ${msg}`,
    };
  }

  const appliedSet = new Set(applied);
  const expectedSet = new Set(expected);
  const pending = expected.filter((m) => !appliedSet.has(m));
  const orphanedInDb = applied.filter((m) => !expectedSet.has(m));

  const ok = pending.length === 0;
  let message = ok ? 'Миграции синхронизированы' : `Не применено миграций: ${pending.length}`;
  if (orphanedInDb.length) {
    message += `; в БД есть устаревшие записи: ${orphanedInDb.join(', ')}`;
  }

  return {
    ok,
    applied,
    expected,
    pending,
    orphanedInDb,
    fixCommand: ok ? null : 'npm run prisma:migrate:deploy',
    message,
  };
}
