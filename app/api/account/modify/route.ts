import { User, db } from "app/api";
import {
  ClientError,
  ConflictError,
  NotAuthenticatedError,
  ServerError,
  getFormData,
  getFormEntry,
  getSessionFromRequest,
  route,
  setSession,
} from "app/api/(utils)";
import { type NextRequest, NextResponse } from "next/server";

import { saveImage } from "..";

const SECONDS_PER_MONTH = 60 * 60 * 24 * 30;

export const POST = route(async (req: NextRequest) => {
  const session = getSessionFromRequest(req);
  if (!session) throw new NotAuthenticatedError();

  const form = await getFormData(req);
  const username = getFormEntry({
    form,
    name: "username",
    type: "string",
    optional: true,
  });
  const image = getFormEntry({
    form,
    name: "image",
    type: "file",
    optional: true,
  });
  if (!username && !image) return new Response();

  let user = await db.user.getFromSession(session);
  if (!user) throw new ServerError("No user corresponding to existing session");

  if (username) {
    if (user.lastNameChangeTime) {
      const diff = new Date().getTime() - user.lastNameChangeTime.getTime();
      if (diff < SECONDS_PER_MONTH)
        throw new ClientError("Cannot change username more than once every 30 days");
    }

    const existingUser = await db.user.findFirst({
      where: { name: username },
    });
    if (existingUser) throw new ConflictError("Username already taken");

    const imagePath = image ? await saveImage(user.name, image) : undefined;
    user = await db.user.update({
      where: { id: user.id },
      data: {
        name: username,
        image: imagePath, // TODO: Does this delete the image if its undefined?
        lastNameChangeTime: new Date(),
      },
    });
  }

  if (username) {
    // Update the session if the username changes
    const authedUser = await user.publicAuthenticated();
    const response = NextResponse.json(authedUser);
    setSession(response.cookies, authedUser);
    return response;
  }

  return new Response();
});
