import type { SlugProps } from "app/(utils)/next";
import {
  ClientError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  Rank,
  db,
  getFormData,
  getFormEntry,
  getSessionFromRequest,
  route,
} from "app/api";
import type { NextRequest } from "next/server";

export const POST = route(async (req: NextRequest, { params }: SlugProps<"applicationId">) => {
  const session = getSessionFromRequest(req);
  if (!session || session.rank === Rank.default)
    throw new ForbiddenError("Reviewer access required");

  const form = await getFormData(req);
  const decision = getFormEntry({ form, name: "decision", type: "string" });
  const reason = getFormEntry({ form, name: "reason", type: "string", optional: true })?.trim();
  if (decision !== "approved" && decision !== "rejected")
    throw new ClientError("Decision must be approved or rejected");
  if (decision === "rejected" && !reason) throw new ClientError("A rejection reason is required");

  const application = await db.moduleApplication.findUnique({
    where: { id: params.applicationId },
  });
  if (!application) throw new NotFoundError("Application not found");
  if (application.status !== "pending") throw new ConflictError("Application is already closed");

  if (decision === "approved") {
    const existingModule = await db.module.findUnique({ where: { name: application.name } });
    if (existingModule) throw new ConflictError("A module with this name already exists");

    await db.$transaction(async transaction => {
      const module = await transaction.module.create({
        data: {
          userId: application.userId,
          name: application.name,
          summary: application.summary,
          hidden: true,
        },
      });
      await transaction.moduleApplication.update({
        where: { id: application.id },
        data: {
          moduleId: module.id,
          status: "approved",
            reviewedById: session.id,
          reviewedAt: new Date(),
          decision: reason || null,
        },
      });
      await transaction.notification.create({
        data: {
          userId: application.userId,
          read: false,
          title: `Module application approved: ${application.name}`,
          description:
            "You can now upload the first release. It will be scanned and sent to manual review before publication.",
        },
      });
    });
  } else {
    await db.$transaction([
      db.moduleApplication.update({
        where: { id: application.id },
        data: {
          status: "rejected",
            reviewedById: session.id,
          reviewedAt: new Date(),
          decision: reason,
        },
      }),
      db.notification.create({
        data: {
          userId: application.userId,
          read: false,
          title: `Module application declined: ${application.name}`,
          description: reason,
        },
      }),
    ]);
  }

  return new Response(`Application ${decision}`);
});
