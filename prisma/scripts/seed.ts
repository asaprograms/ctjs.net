import * as fs from "node:fs/promises";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import JSZip from "jszip";
import { type Module, PrismaClient, Rank, type Release, type User } from "prisma/generated/client";
import versions from "public/versions.json";

const db = new PrismaClient();

// Remove all existing data
await db.email.deleteMany({});
await db.notification.deleteMany({});
await db.release.deleteMany({});
await db.module.deleteMany({});
await db.user.deleteMany({});

await fs.rm("./storage", { recursive: true });
await fs.mkdir("./storage/modules", { recursive: true });
await fs.mkdir("./storage/users", { recursive: true });

function randomModuleName() {
  let name = "";
  let capitalizeNext = true;
  for (const ch of faker.lorem.slug()) {
    if (capitalizeNext) {
      name += ch.toUpperCase();
      capitalizeNext = false;
    } else if (ch === "-") {
      capitalizeNext = true;
    } else {
      name += ch;
    }
  }
  return name;
}

async function randomImage(saveLocation: string) {
  return await faker.helpers.maybe(
    async () => {
      const url = faker.image.url();
      const image = await fetch(url);
      await fs.writeFile(saveLocation, Buffer.from(await image.arrayBuffer()));
      return saveLocation;
    },
    { probability: 0.3 },
  );
}

async function randomScripts(
  module: Module,
  release: Release,
  user: User,
): Promise<{ scripts: Buffer; metadata: Buffer }> {
  const entryName = faker.helpers.weightedArrayElement([
    { value: "index.js", weight: 15 },
    { value: undefined, weight: 5 },
    { value: "entry.js", weight: 2 },
  ]);
  const mixinName = faker.helpers.weightedArrayElement([
    { value: undefined, weight: 10 },
    { value: "mixin.js", weight: 1 },
  ]);

  const metadata = JSON.stringify(
    {
      name: module.name,
      summary: module.summary,
      description: module.description,
      creator: user.name,
      version: release.releaseVersion,
      tags: module.tags,
      entry: entryName,
      mixinEntry: mixinName,
      changelog: release.changelog,
      helpMessage: faker.helpers.maybe(faker.lorem.text, { probability: 0.2 }),
      requires: await Promise.all(
        faker.helpers
          .arrayElements(Array.from(moduleIds), { min: 0, max: 3 })
          .map(id => db.module.findUniqueOrThrow({ where: { id } }).then(m => m.name)),
      ),
    },
    null,
    4,
  );

  const zip = new JSZip();
  zip.file("metadata.json", metadata);

  if (entryName) {
    zip.file(
      entryName,
      `\
register("command", () => {
  ChatLib.chat(\`Hello from module ${module.name}!\`);
}).setName("${module.name}");
`,
    );
  } else {
    zip.file(
      "lib.js",
      `\
export function foo() {
  ChatLib.chat(\`Hello from module ${module.name}!\`);
}
`,
    );
  }

  if (mixinName) {
    zip.file(
      mixinName,
      `\
// This is the mixin file!
`,
    );
  }

  return {
    scripts: await zip.generateAsync({ type: "nodebuffer" }),
    metadata: Buffer.from(metadata),
  };
}

const validTags = (await fs.readFile("./public/tags.txt")).toString().split("\n");

// Generate random users
const userIds = new Set<string>();
const nonDefaultUserIds = new Set<string>();
const numUsers = faker.number.int({ min: 15, max: 30 });

for (let i = 0; i < numUsers; i++) {
  const username = faker.internet.userName();
  const imagePath = await randomImage(`./storage/users/${username}.png`);

  const user = await db.user.create({
    data: {
      email: faker.internet.email(),
      emailVerified: faker.datatype.boolean(0.85),
      name: username,
      password: bcrypt.hashSync(faker.internet.password(), bcrypt.genSaltSync()),
      image: imagePath,
      lastNameChangeTime: faker.helpers.maybe(
        () => faker.date.between({ from: new Date(2024, 0), to: Date.now() }),
        { probability: 0.1 },
      ),
      passwordResetToken: null,
      verificationToken: null,
      rank: faker.helpers.enumValue(Rank),
    },
  });

  userIds.add(user.id);
  if (user.rank !== Rank.default) nonDefaultUserIds.add(user.id);
}

// Generate random modules
const moduleIds = new Set<string>();
const numModules = numUsers + faker.number.int({ min: 5, max: 20 });

for (let i = 0; i < numModules; i++) {
  const moduleName = randomModuleName();
  await fs.mkdir(`./storage/modules/${moduleName}`);
  const imagePath = await randomImage(`./storage/modules/${moduleName}/image.png`);

  const module = await db.module.create({
    data: {
      name: moduleName,
      summary: faker.helpers.maybe(faker.lorem.sentence, { probability: 0.7 }),
      description: faker.helpers.maybe(faker.lorem.text, { probability: 0.7 }),
      tags: faker.helpers
        .maybe(() => faker.helpers.arrayElements(validTags), { probability: 0.5 })
        ?.join(","),
      downloads: 0, // Incremented as releases are made
      hidden: faker.datatype.boolean(0.1),
      image: imagePath,
      userId: faker.helpers.arrayElement(Array.from(userIds)),
    },
  });

  moduleIds.add(module.id);
}

// Generate random releases
const numReleases = numModules + faker.number.int({ min: 0, max: 10 });

for (let i = 0; i < numReleases; i++) {
  const moduleId = faker.helpers.arrayElement(Array.from(moduleIds));
  const module = await db.module.findUniqueOrThrow({
    where: { id: moduleId },
    include: { user: true },
  });
  const verified = faker.datatype.boolean(0.8);

  // Simulate old releases that don't have a verifier
  const verifiedById = verified
    ? faker.helpers.maybe(() => faker.helpers.arrayElement(Array.from(nonDefaultUserIds)), {
        probability: 0.6,
      })
    : undefined;

  const verifiedAt = verifiedById
    ? faker.date.between({ from: new Date(2024, 0), to: Date.now() })
    : undefined;

  const release = await db.release.create({
    data: {
      moduleId,
      modVersion: faker.helpers.arrayElement(Object.keys(versions.modVersions)),
      releaseVersion: faker.system.semver(),
      changelog: faker.helpers.maybe(faker.lorem.text, { probability: 0.3 }),
      downloads: faker.number.int({ min: 0, max: 1000 }),
      verified,
      verifiedById,
      verifiedAt,
    },
  });

  const { scripts, metadata } = await randomScripts(module, release, module.user);
  await fs.mkdir(`./storage/modules/${module.name}/${release.id}`);
  await fs.writeFile(`./storage/modules/${module.name}/${release.id}/scripts.zip`, scripts);
  await fs.writeFile(`./storage/modules/${module.name}/${release.id}/metadata.json`, metadata);

  await db.module.update({
    where: {
      id: moduleId,
    },
    data: {
      downloads: {
        increment: release.downloads,
      },
    },
  });
}
