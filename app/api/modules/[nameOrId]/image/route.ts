import * as fs from "node:fs/promises";
import type { SlugProps } from "app/(utils)/next";
import { NotFoundError, route } from "app/api/(utils)";
import * as modules from "app/api/modules";
import type { NextRequest } from "next/server";

export const GET = route(async (req: NextRequest, { params }: SlugProps<"nameOrId">) => {
  const module = await modules.getOne(params.nameOrId);
  if (!module) throw new NotFoundError("Module not found");

  const imageUrl = await module.imageDataUrl();
  if (!imageUrl) return new Response(null, { status: 204 });
  return new Response(imageUrl, { status: 200 });
});
