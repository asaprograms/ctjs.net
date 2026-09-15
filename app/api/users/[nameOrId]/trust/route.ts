import type { SlugProps } from "app/(utils)/next";
import { ForbiddenError, getSessionFromRequest, route } from "app/api";
import { Rank, db } from "app/api";
import type { NextRequest } from "next/server";

export const POST = route(async (req: NextRequest, { params }: SlugProps<"nameOrId">) => {
  const sessionUser = getSessionFromRequest(req);
  if (!sessionUser || sessionUser.rank !== Rank.admin) throw new ForbiddenError("No permission");

  const user = await db.user.findFirst({
    where: {
      OR: [{ id: params.nameOrId }, { name: params.nameOrId }],
    },
  });
  if (!user) return new Response("User not found", { status: 404 });

  if (user.rank === Rank.default) user.rank = Rank.trusted;
  else if (user.rank === Rank.trusted) user.rank = Rank.default;

  await db.user.update({
    where: { id: user.id },
    data: { rank: user.rank },
  });

  return Response.json({ new_rank: user.rank });
});
