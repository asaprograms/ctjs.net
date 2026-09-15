import { NotAuthenticatedError, ServerError, getSessionFromRequest, route } from "app/api";
import { User, db } from "app/api";
import type { NextRequest } from "next/server";

export const GET = route(async (req: NextRequest) => {
  const user = getSessionFromRequest(req);
  if (!user) throw new NotAuthenticatedError();
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
  });
  if (!dbUser) throw new ServerError(`Failed to find user with it ${user.id}`);
  return Response.json(await dbUser.publicAuthenticated());
});
