import { ForbiddenError, route } from "app/api";
import * as modules from "app/api/modules";
import type { NextRequest } from "next/server";

export const GET = route(async (req: NextRequest) => {
  return Response.json(await modules.getManyPublic(req.nextUrl.searchParams));
});

export const PUT = route(async () => {
  throw new ForbiddenError("Direct module creation is disabled. Submit an application at /apply.");
});
