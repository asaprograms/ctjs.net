import type { URLSearchParams } from "node:url";
import type { Prisma, PublicModule, RelationalModule, Release, Session, User } from "app/api";
import { BadQueryParamError, ClientError, getSessionFromCookies } from "app/api";
import { type Module, Rank, type Sort, db } from "app/api";
import Version from "app/api/(utils)/Version";
import { cookies } from "next/headers";
import { isUUID } from "validator";

import { saveImageFile } from "../(utils)/assets";

export enum Hidden {
  NONE = "none",
  ONLY = "only",
  ALL = "all",
}

export interface Metadata {
  name?: string;
  version?: string;
  entry?: string;
  mxinEntry?: string;
  tags?: string[];
  pictureLink?: string;
  creator?: string;
  author?: string;
  description?: string;
  requires?: string[];
  helpMessage?: string;
  changelog?: string;
}

export const getOnePublic = async (
  nameOrId: string,
  session?: Session,
): Promise<PublicModule | undefined> => {
  return (await getOne(nameOrId, session))?.public(session);
};

// TODO: Can we add the ability to omit "releases" or "user" in a type-safe way?
export const getOne = async (
  nameOrId: string,
  existingSession?: Session,
): Promise<RelationalModule<"releases" | "user"> | undefined> => {
  const module = await db.module.findUnique({
    include: {
      user: true,
      releases: true,
    },
    where: isUUID(nameOrId)
      ? {
          id: nameOrId,
        }
      : {
          name: nameOrId,
        },
  });

  if (!module) return undefined;
  if (!module.hidden) return module;

  const session = existingSession ?? getSessionFromCookies(cookies());
  if (session?.id === module.user.id || session?.rank !== Rank.default) return module;

  return undefined;
};

export interface ManyResponse {
  modules: Module[];
  meta: {
    total: number;
    offset: number;
    limit: number;
    sort: Sort;
  };
}

export interface ManyResponsePublic {
  modules: PublicModule[];
  meta: ManyResponse["meta"];
}

export const getManyPublic = async (params: URLSearchParams): Promise<ManyResponsePublic> => {
  const { modules, meta } = await getMany(params);

  return {
    modules: await Promise.all(modules.map(m => m.public())),
    meta,
  };
};

export const getMany = async (
  params: URLSearchParams,
  session: Session | undefined = getSessionFromCookies(cookies()),
): Promise<ManyResponse> => {
  const name = params.get("name");
  const summary = params.get("summary");
  const description = params.get("description");
  const owner = params.get("owner");
  const tags = params.get("tag");
  const q = params.get("q");
  let limit = getIntQuery(params, "limit") ?? 25;
  let offset = getIntQuery(params, "offset") ?? 0;
  let sort = params.get("sort") ?? "DATE_CREATED_DESC";
  const hidden = params.get("hidden") ?? Hidden.NONE;
  const trusted = getBooleanQuery(params, "trusted") ?? false;

  if (limit < 1) limit = 1;
  if (limit > 100) limit = 100;
  if (offset < 0) offset = 0;

  if (
    Array.isArray(sort) ||
    (sort !== "DATE_CREATED_DESC" &&
      sort !== "DATE_CREATED_ASC" &&
      sort !== "DOWNLOADS_DESC" &&
      sort !== "DOWNLOADS_ASC")
  )
    throw new BadQueryParamError("sort", sort);

  const query: Parameters<(typeof db)["module"]["findMany"]>[0] = {
    include: {
      user: true,
    },
  };

  const addAndCondition = (condition: NonNullable<(typeof query)["where"]>) => {
    if (!query.where) {
      query.where = condition;
    } else {
      query.where = { AND: [query.where, condition] };
    }
  };

  if (owner) {
    const values = Array.isArray(owner) ? owner : owner.split(",");
    const conditions: Prisma.ModuleWhereInput[] = [];
    for (const value of values) {
      conditions.push({
        user: isUUID(value) ? { id: value } : { name: { contains: value } },
      });
    }

    if (conditions.length === 1) {
      addAndCondition(conditions[0]);
    } else {
      addAndCondition({ OR: conditions });
    }
  }

  if (tags) {
    for (const value of tags.split(",")) addAndCondition({ tags: { contains: value } });
  }

  if (hidden !== Hidden.NONE && hidden !== Hidden.ALL && hidden !== Hidden.ONLY)
    throw new BadQueryParamError("hidden", hidden);

  /*
   * There are quite a few permutations of the hidden parameter and the session that affects when we show
   * hidden modules. Here are the combinations:
   *
   * ┌──────────────┬─────────────────────────┬──────────────────────────────────────────────────┬──────────────────┐
   * │              │  Admin/Trusted Session  │                 Default Session                  │    No Session    │
   * ├──────────────┼─────────────────────────┼──────────────────────────────────────────────────┼──────────────────┤
   * │ Hidden.NONE  │  hidden == false        │  hidden == false                                 │  hidden == false │
   * │ Hidden.ONLY  │  hidden == true         │  hidden == true && module.userId == session.id   │  hidden == false │
   * │ Hidden.ALL   │  [1]                    │  hidden == false || module.userId == session.id  │  hidden == false │
   * └──────────────┴─────────────────────────┴──────────────────────────────────────────────────┴──────────────────┘
   *
   * [1]: Here, there is no restriction, and so this situation results in no queries being added
   *
   * Also note that in the No Session-Hidden.ONLY case, the user will always get zero modules, but we don't return early
   * to keep the logic simple
   */

  if (!session || hidden === Hidden.NONE) {
    addAndCondition({ hidden: false });
  } else if (hidden === Hidden.ONLY) {
    if (session.rank === Rank.default) {
      addAndCondition({ hidden: true, userId: session.id });
    } else {
      addAndCondition({ hidden: true });
    }
  } else if (session.rank === Rank.default) {
    addAndCondition({
      OR: [{ hidden: false }, { userId: session.id }],
    });
  }

  if (trusted) addAndCondition({ user: { rank: { not: Rank.default } } });

  if (name) addAndCondition({ name: { contains: name } });

  if (summary) addAndCondition({ summary: { contains: summary } });

  if (description) addAndCondition({ description: { contains: description } });

  if (q) {
    // This is a legacy option that basically acts as name, summary, and description at once
    if (Array.isArray(q)) throw new BadQueryParamError("q", q);

    addAndCondition({
      OR: [
        { description: { contains: q } },
        { name: { contains: q } },
        { user: { name: { contains: q } } },
      ],
    });
  }

  // Hide modules with no releases if necessary
  if (session?.rank !== Rank.trusted && session?.rank !== Rank.admin) {
    const condition = {
      releases: { some: { verified: true } },
    } as const;
    if (session) {
      addAndCondition({
        OR: [condition, { userId: session.id }],
      });
    } else {
      addAndCondition(condition);
    }
  }

  switch (sort) {
    case "DOWNLOADS_ASC":
      query.orderBy = { downloads: "asc" };
      break;
    case "DOWNLOADS_DESC":
      query.orderBy = { downloads: "desc" };
      break;
    case "DATE_CREATED_ASC":
      query.orderBy = { createdAt: "asc" };
      break;
    default:
      query.orderBy = { createdAt: "desc" };
      sort = "DATE_CREATED_DESC";
      break;
  }

  query.skip = offset;
  query.take = limit;

  const modules = await db.module.findMany(query);
  return {
    modules,
    meta: { total: modules.length, offset, limit, sort: sort as Sort },
  };
};

const getIntQuery = (params: URLSearchParams, name: string): number | undefined => {
  const value = params.get(name);
  if (!value) return undefined;
  if (Array.isArray(value)) throw new BadQueryParamError(name, value);

  const id = Number.parseInt(value);
  if (Number.isNaN(id)) throw new BadQueryParamError(name, value);
  return id;
};

export const getBooleanQuery = (params: URLSearchParams, name: string): boolean | undefined => {
  const value = params.get(name);
  if (!value) return undefined;
  if (Array.isArray(value)) throw new BadQueryParamError(name, value);

  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;

  // TODO: Add an "expected" parameter here
  throw new BadQueryParamError(name, value);
};

export const getTagsFromForm = (data: FormData): string[] => {
  return data
    .getAll("tags")
    .flatMap(tag => {
      if (typeof tag !== "string") throw new ClientError("Tag must be a string");
      return tag.split(",");
    })
    .map(tag => tag.trim())
    .filter(tag => tag.length);
};

export const saveImage = async (module: Module, file: string | Blob): Promise<string> => {
  (await saveImageFile(file)).toFile(`storage/modules/${module.name}.png`);
  module.image = `/storage/modules/${module.name}.png`;
  return module.image;
};

export const findMatchingRelease = async (
  module: RelationalModule<"releases">,
  modVersion: Version,
): Promise<Release | undefined> => {
  const releases = module.releases.map(release => ({
    release,
    releaseVersion: Version.parseOrThrow(release.releaseVersion),
    modVersion: Version.parseOrThrow(release.modVersion),
  }));

  releases.sort((r1, r2) =>
    Version.compareAll([
      [r1.releaseVersion, r2.releaseVersion],
      [r1.modVersion, r2.modVersion],
    ]),
  );

  for (const release of releases) {
    if (release.modVersion.major <= modVersion.major) return release.release;
  }
};
