import { type User, db } from "app/api";
import bcrypt from "bcrypt";

import { saveImageFile } from "../(utils)/assets";

export const verify = async (username: string, password: string): Promise<User | undefined> => {
  const user = await db.user.findFirst({
    where: {
      OR: [{ name: username }, { email: username }],
    },
  });

  if (user && bcrypt.compareSync(password, user.password)) return user;
};

export const saveImage = async (username: string, file: string | Blob): Promise<string> => {
  (await saveImageFile(file)).toFile(`storage/users/${username}.png`);
  return `/storage/users/${username}.png`;
};
