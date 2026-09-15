import type { SlugProps } from "app/(utils)/next";
import { BadQueryParamError, MissingQueryParamError, NotFoundError, db, route } from "app/api";
import Version from "app/api/(utils)/Version";
import * as modules from "app/api/modules";
import { getMetadata } from "app/api/modules/[nameOrId]/releases";
import type { NextRequest } from "next/server";

export const GET = route(async (req: NextRequest, { params }: SlugProps<"nameOrId">) => {
  const searchParams = req.nextUrl.searchParams;

  const module = await modules.getOne(params.nameOrId);
  if (!module) throw new NotFoundError("Module not found");

  const modVersionStr = searchParams.get("modVersion");
  if (!modVersionStr) throw new MissingQueryParamError("modVersion");

  const modVersion = Version.parse(modVersionStr);
  if (!modVersion) throw new BadQueryParamError("modVersion", modVersionStr);

  const matchingRelease = await modules.findMatchingRelease(module, modVersion);
  if (!matchingRelease) throw new NotFoundError("No matching release found");

  const buffer = await getMetadata(module, matchingRelease.id);
  return new Response(buffer?.toString("utf-8"), {
    headers: { "Content-Type": "application/json" },
  });
});
