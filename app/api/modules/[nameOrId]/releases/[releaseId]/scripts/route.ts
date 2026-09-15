import type { SlugProps } from "app/(utils)/next";
import { NotFoundError, route } from "app/api";
import * as releases from "app/api/modules/[nameOrId]/releases";
import type { NextRequest } from "next/server";

export const GET = route(
  async (req: NextRequest, { params }: SlugProps<"nameOrId" | "releaseId">) => {
    const buffer = await releases.getScripts(params.nameOrId as string, params.releaseId as string);
    if (!buffer) throw new NotFoundError("Unknown module or release id");
    return new Response(buffer, {
      headers: { "Content-Type": "application/zip" },
    });
  },
);
