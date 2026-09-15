import sharp from "sharp";

import { ClientError } from "./errors";

const MAX_IMAGE_SIZE = 1000;

export const saveImageFile = async (file: string | Blob): Promise<sharp.Sharp> => {
  if (typeof file === "string") throw new ClientError("Module image must be a file");

  const image = await sharp(await file.arrayBuffer());
  let { width, height } = await image.metadata();
  if (!width || !height) throw new Error("Unable to get metadata for image");

  if (width > MAX_IMAGE_SIZE) {
    height /= width / MAX_IMAGE_SIZE;
    width = MAX_IMAGE_SIZE;
  }

  if (height > MAX_IMAGE_SIZE) {
    width /= height / MAX_IMAGE_SIZE;
    height = MAX_IMAGE_SIZE;
  }

  image.resize(Math.floor(width), Math.floor(height), { fit: "contain" });
  return image.png();
};
