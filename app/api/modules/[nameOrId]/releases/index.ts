import * as fs from "node:fs/promises";
import type { RelationalModule } from "app/api";
import { type Module, type Release, db } from "app/api";
import * as modules from "app/api/modules";

export async function getScripts(
  moduleOrIdentifier: Module | RelationalModule<"releases"> | string,
  releaseId: string,
): Promise<Buffer | undefined> {
  let moduleName: string;
  let releases: Release[];

  if (typeof moduleOrIdentifier === "string") {
    const module = await modules.getOne(moduleOrIdentifier);
    if (!module) throw new Error(`Invalid name or ID: ${moduleOrIdentifier}`);
    moduleName = module.name;
    releases = module.releases;
  } else {
    moduleName = moduleOrIdentifier.name;
    if ("releases" in moduleOrIdentifier) {
      releases = moduleOrIdentifier.releases;
    } else {
      releases = await db.release.findMany({
        where: {
          module: {
            id: moduleOrIdentifier.id,
          },
        },
      });
    }
  }

  for (const release of releases) {
    if (release.id === releaseId) {
      const result = await fs.readFile(`storage/modules/${moduleName}/${release.id}/scripts.zip`);

      // Increment download counters
      await db.module.update({
        where: { name: moduleName },
        data: { downloads: { increment: 1 } },
      });
      await db.release.update({
        where: { id: release.id },
        data: { downloads: { increment: 1 } },
      });

      return result;
    }
  }
}

export async function getMetadata(
  moduleOrIdentifier: Module | RelationalModule<"releases"> | string,
  releaseId: string,
): Promise<Buffer | undefined> {
  let moduleName: string;
  let releases: Release[];

  if (typeof moduleOrIdentifier === "string") {
    const module = await modules.getOne(moduleOrIdentifier);
    if (!module) throw new Error(`Invalid name or ID: ${moduleOrIdentifier}`);
    moduleName = module.name;
    releases = module.releases;
  } else {
    moduleName = moduleOrIdentifier.name;
    if ("releases" in moduleOrIdentifier) {
      releases = moduleOrIdentifier.releases;
    } else {
      releases = await db.release.findMany({
        where: {
          module: {
            id: moduleOrIdentifier.id,
          },
        },
      });
    }
  }

  for (const release of releases) {
    if (release.id === releaseId)
      return await fs.readFile(`storage/modules/${moduleName}/${release.id}/metadata.json`);
  }
}
