import type { SlugProps } from "app/(utils)/next";
import { ForbiddenError, NotFoundError, getSessionFromRequest, route } from "app/api";
import { Rank, Release, db } from "app/api";
import { deleteReleaseVerificationMessage } from "app/api/(utils)/webhooks";
import * as modules from "app/api/modules";
import type { NextRequest } from "next/server";

export const DELETE = route(
  async (req: NextRequest, { params }: SlugProps<"nameOrId" | "releaseId">) => {
    const session = getSessionFromRequest(req);
    if (!session) throw new ForbiddenError("No permission to delete this release");

    const module = await modules.getOne(params.nameOrId);
    if (!module) throw new NotFoundError("Module not found");

    if (module.user.id !== session.id && session.rank === Rank.default)
      throw new ForbiddenError("No permission to delete this release");

    const release = await db.release.findUnique({ where: { id: params.releaseId } });
    if (!release) throw new NotFoundError("Release not found");

    deleteReleaseVerificationMessage(release);
    db.release.delete({ where: { id: release.id } });

    return new Response("Deleted release");
  },
);
