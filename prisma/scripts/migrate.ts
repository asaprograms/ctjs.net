import * as fs from "node:fs/promises";
import { parseArgs } from "node:util";
import colors from "ansi-colors";
import { MultiBar } from "cli-progress";
import { PrismaClient } from "../generated/client";
import { PrismaClient as PrismaLegacyClient } from "../generated/legacy-client";

const legacyClient = new PrismaLegacyClient();
const client = new PrismaClient();

// Remove all existing data
await client.email.deleteMany({});
await client.notification.deleteMany({});
await client.release.deleteMany({});
await client.module.deleteMany({});
await client.user.deleteMany({});

let bar = new MultiBar({
  format: `Migrating Users | ${colors.cyan("{bar}")} | {percentage}% | {value}/{total}`,
});

const legacyUsers = await legacyClient.users.findMany({});
const legacyUserIdMap = new Map<number, string>();
let progress = bar.create(legacyUsers.length, 0);

for (const legacyUser of await legacyClient.users.findMany({})) {
  if (legacyUser.name.length > 32) {
    bar.log(`Warning: Skipping user "${legacyUser.name}" due to name length\n`);
  } else {
    const user = await client.user.create({
      data: {
        name: legacyUser.name,
        email: legacyUser.email,
        emailVerified: false,
        password: legacyUser.password,
        rank: legacyUser.rank,
      },
    });

    legacyUserIdMap.set(legacyUser.id, user.id);
  }

  progress.increment();
}

bar.stop();

bar = new MultiBar({
  format: `Migrating Modules | ${colors.cyan("{bar}")} | {percentage}% | {value}/{total}`,
});

const legacyModules = await legacyClient.modules.findMany({});
const legacyModuleIdMap = new Map<number, string>();
progress = bar.create(legacyModules.length, 0);

for (const legacyModule of legacyModules) {
  // Skip a module with an invalid name
  if (legacyModule.name.startsWith("&9")) continue;

  const userId = legacyUserIdMap.get(legacyModule.user_id);
  if (!userId)
    throw new Error(
      `Unknown legacy user ID ${legacyModule.user_id} for module ${legacyModule.name}`,
    );

  let imagePath: string | null = null;
  if (legacyModule.image) {
    const data = await fetch(legacyModule.image);
    imagePath = `./storage/modules/${legacyModule.name}`;

    try {
      await fs.mkdir(imagePath, { recursive: true });
    } catch {}

    imagePath += "/image.png";
    await fs.writeFile(imagePath, Buffer.from(await data.arrayBuffer()));
  }

  const module = await client.module.create({
    data: {
      userId,
      name: legacyModule.name,
      description: legacyModule.description,
      image: imagePath,
      downloads: legacyModule.downloads,
      hidden: legacyModule.hidden,
      tags: legacyModule.tags ?? "",
    },
  });

  // Migrate all of the module's releases
  const legacyReleases = await legacyClient.releases.findMany({
    where: {
      module_id: legacyModule.id,
    },
  });

  for (const legacyRelease of legacyReleases) {
    const release = await client.release.create({
      data: {
        moduleId: module.id,
        releaseVersion: legacyRelease.release_version,
        modVersion: legacyRelease.mod_version,
        changelog: legacyRelease.changelog,
        downloads: legacyRelease.downloads,
        verified: legacyRelease.verified,
      },
    });

    let uuid = legacyRelease.id.toString("hex");
    uuid = `${uuid.substring(0, 8)}-${uuid.substring(8, 12)}-${uuid.substring(12, 16)}-${uuid.substring(16, 20)}-${uuid.substring(20)}`;

    const oldPath = `./legacy-storage/${legacyModule.name.toLowerCase()}/${uuid}`;
    const newPath = `./storage/modules/${module.name}/${release.id}`;
    await fs.cp(oldPath, newPath, { recursive: true });

    if (legacyRelease.verification_token !== null)
      bar.log(
        `Warning: Release ${uuid} of module ${legacyModule.id} has a pending verification token\n`,
      );
  }

  legacyModuleIdMap.set(legacyModule.id, module.id);
  progress.increment();
}

bar.stop();
