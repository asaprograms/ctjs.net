import { isEmailVerified } from "app/(utils)";
import type { SlugProps } from "app/(utils)/next";
import {
  ClientError,
  ConflictError,
  ForbiddenError,
  NotAuthenticatedError,
  NotFoundError,
  db,
  getFormData,
  getFormEntry,
  getSessionFromRequest,
  route,
} from "app/api";
import { type Notification, Rank } from "app/api";
import { deleteReleaseVerificationMessage } from "app/api/(utils)/webhooks";
import { isUUID } from "validator";

export const POST = route(async (req, { params }: SlugProps<"nameOrId" | "releaseId">) => {
  const { nameOrId, releaseId } = params;

  const session = getSessionFromRequest(req);
  if (!session || session.rank === Rank.default) throw new NotAuthenticatedError("No permission");

  const sessionUser = await db.user.getFromSession(session);
  if (!sessionUser) throw new NotAuthenticatedError("No permission");
  if (!isEmailVerified(session)) throw new ForbiddenError("Email not verified");

  const release = await db.release.findUnique({
    where: {
      id: releaseId,
      module: isUUID(nameOrId) ? { id: nameOrId } : { name: nameOrId },
    },
    include: {
      module: true,
      scanReport: true,
    },
  });
  if (!release) throw new NotFoundError("Invalid module or release");

  if (release.verified) throw new ConflictError("Release is already verified");
  if (!release.scanReport || !["passed", "flagged"].includes(release.scanStatus))
    throw new ConflictError("Release scanning must complete before manual review");

  const form = await getFormData(req);
  const verified = getFormEntry({ form, name: "verified", type: "boolean" });
  const reason = getFormEntry({
    form,
    name: "reason",
    type: "string",
    optional: true,
  });

  if (!verified && !reason) throw new ClientError("Must include a reason when rejecting a release");
  if (verified && release.scanStatus === "flagged" && !reason)
    throw new ClientError("Approving a flagged release requires reviewer notes");

  const module = release.module;

  await db.notification.create({
    data: {
      userId: module.userId,
      read: false,
      ...(verified
        ? {
            title: `Release v${release.releaseVersion} for module ${module.name} has been verified`,
          }
        : {
            title: `Release v${release.releaseVersion} for module ${module.name} has been rejected`,
            description: `Your release has been rejected, as it is not suitable for publication. If you have any questions, please contact us on our Discord server.\n\nReason given for rejection: ${reason}`,
          }),
    },
  });

  await db.$transaction([
    db.manualReview.create({
      data: {
        releaseId: release.id,
        reviewerId: sessionUser.id,
        decision: verified ? "approved" : "rejected",
        notes: reason,
      },
    }),
    db.release.update({
      where: { id: release.id },
      data: {
        verified,
        reviewStatus: verified ? "approved" : "rejected",
        verifiedAt: verified ? new Date() : null,
        verifiedById: verified ? sessionUser.id : null,
      },
    }),
  ]);

  await deleteReleaseVerificationMessage(release);

  if (verified) return new Response("Release verified");
  return new Response("Release rejected");
});
