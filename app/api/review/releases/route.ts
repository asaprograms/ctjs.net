import { ForbiddenError, Rank, db, getSessionFromRequest, route } from "app/api";
import type { NextRequest } from "next/server";

export const GET = route(async (req: NextRequest) => {
  const session = getSessionFromRequest(req);
  if (!session || session.rank === Rank.default)
    throw new ForbiddenError("Reviewer access required");

  const releases = await db.release.findMany({
    where: { reviewStatus: "pending" },
    include: {
      module: { include: { user: true } },
      scanReport: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(
    releases.map(release => ({
      id: release.id,
      moduleId: release.module.id,
      moduleName: release.module.name,
      owner: release.module.user.name,
      releaseVersion: release.releaseVersion,
      modVersion: release.modVersion,
      changelog: release.changelog,
      submittedAt: release.createdAt.getTime(),
      scan: release.scanReport
        ? {
            status: release.scanReport.status,
            score: release.scanReport.score,
            summary: release.scanReport.summary,
            sha256: release.scanReport.archiveSha256,
            findings: release.scanReport.findings,
          }
        : null,
    })),
  );
});
