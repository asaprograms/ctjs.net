import { Module, Release, db } from "app/api";

interface Stats {
  moduleCount: number;
  releaseCount: number;
  totalImports: number;
}

export async function getStats(): Promise<Stats> {
  const moduleCount = (await db.module.aggregate({ _count: true }))._count;
  const releaseCount = (await db.release.aggregate({ _count: true }))._count;
  const downloadCount =
    (await db.module.aggregate({ _sum: { downloads: true } }))._sum.downloads ?? 0;

  return {
    moduleCount,
    releaseCount,
    totalImports: downloadCount,
  };
}
