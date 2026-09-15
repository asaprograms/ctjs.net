import { type Prisma, type PublicUser, type User, db } from "app/api";
import { isUUID } from "validator";

export const getUserPublic = async (nameOrId: string): Promise<PublicUser | undefined> => {
  return (await getUser(nameOrId))?.public();
};

export const getUser = async (nameOrId: string): Promise<User | null> => {
  const query: Prisma.UserWhereUniqueInput = isUUID(nameOrId)
    ? { id: nameOrId }
    : { name: nameOrId };
  return await db.user.findUnique({
    where: query,
  });
};

export const getDownloads = async (user: User): Promise<number> => {
  const result = await db.module.aggregate({
    where: {
      userId: user.id,
    },
    _count: {
      downloads: true,
    },
  });
  return result._count.downloads;
};
