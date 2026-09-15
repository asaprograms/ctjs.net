import { isEmailVerified } from "app/(utils)";
import {
  ClientError,
  ConflictError,
  ForbiddenError,
  NotAuthenticatedError,
  Rank,
  db,
  getFormData,
  getFormEntry,
  getSessionFromRequest,
  route,
} from "app/api";
import type { NextRequest } from "next/server";

const moduleNamePattern = /^[A-Za-z0-9][A-Za-z0-9_-]{1,63}$/;

export const POST = route(async (req: NextRequest) => {
  const session = getSessionFromRequest(req);
  if (!session) throw new NotAuthenticatedError();
  if (!isEmailVerified(session)) throw new ForbiddenError("Email not verified");

  const form = await getFormData(req);
  const name = getFormEntry({ form, name: "name", type: "string" }).trim();
  const summary = getFormEntry({ form, name: "summary", type: "string" }).trim();
  const sourceUrl = getFormEntry({ form, name: "sourceUrl", type: "string" }).trim();
  const notes = getFormEntry({ form, name: "notes", type: "string", optional: true })?.trim();

  if (!moduleNamePattern.test(name))
    throw new ClientError("Module names must be 2 to 64 characters using letters, numbers, _ or -");
  if (summary.length < 20 || summary.length > 300)
    throw new ClientError("Summary must be between 20 and 300 characters");

  let source: URL;
  try {
    source = new URL(sourceUrl);
  } catch {
    throw new ClientError("Source URL is invalid");
  }
  if (source.protocol !== "https:") throw new ClientError("Source URL must use HTTPS");

  const [existingModule, existingApplication] = await Promise.all([
    db.module.findUnique({ where: { name } }),
    db.moduleApplication.findFirst({
      where: { name, status: "pending" },
    }),
  ]);
  if (existingModule) throw new ConflictError("A module with this name already exists");
  if (existingApplication)
    throw new ConflictError("An application for this module name is pending");

  const application = await db.moduleApplication.create({
    data: {
      userId: session.id,
      name,
      summary,
      sourceUrl: source.toString(),
      notes: notes || null,
    },
  });

  return Response.json({ id: application.id, status: application.status }, { status: 201 });
});

export const GET = route(async (req: NextRequest) => {
  const session = getSessionFromRequest(req);
  if (!session || session.rank === Rank.default)
    throw new ForbiddenError("Reviewer access required");

  const applications = await db.moduleApplication.findMany({
    where: { status: "pending" },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return Response.json(
    applications.map(application => ({
      id: application.id,
      name: application.name,
      summary: application.summary,
      sourceUrl: application.sourceUrl,
      notes: application.notes,
      submittedBy: application.user.name,
      submittedAt: application.createdAt.getTime(),
    })),
  );
});
