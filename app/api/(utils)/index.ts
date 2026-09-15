import type { SlugProps } from "app/(utils)/next";
import type { NextRequest } from "next/server";

import { ApiError, ClientError, MissingFormEntryError } from "./errors";

type ApiHandler<T extends string> = (
  req: NextRequest,
  params: SlugProps<T>,
) => Response | Promise<Response>;

export function route<T extends string>(func: ApiHandler<T>): ApiHandler<T> {
  return async (req, params) => {
    try {
      return await func(req, params);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.log(e);

      if (e instanceof ApiError) return new Response(e.message, { status: e.statusCode });

      if (process.env.NODE_ENV !== "production") {
        // This can leak SQL queries to the client, so don't do this in production
        if (e instanceof Error) return new Response(e.message, { status: 500 });
      }

      return new Response("Internal server error", { status: 500 });
    }
  };
}

export function toParams(searchParams: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    params.set(key, value);
  }

  return params;
}

export function getFormData(req: NextRequest): Promise<FormData> {
  const contentType = req.headers.get("content-type");
  if (!contentType) throw new ClientError("Missing Content-Type header", 400);
  if (
    contentType.startsWith("multipart/form-data") ||
    contentType.startsWith("application/x-www-form-urlencoded")
  )
    return req.formData();

  throw new ClientError(
    `Expected Content-Type "multipart/form-data" or "application/x-www-form-urlencoded"`,
    400,
  );
}

interface FormOptions {
  form: FormData;
  name: string;
  type: "boolean" | "string" | "file";
  optional?: true;
}

type FormEntryTypeBase<T extends FormOptions> = T["type"] extends "string"
  ? string
  : T["type"] extends "boolean"
    ? boolean
    : File;

type FormEntryType<T extends FormOptions> = T["optional"] extends true
  ? FormEntryTypeBase<T> | undefined
  : FormEntryTypeBase<T>;

export function getFormEntry<const T extends FormOptions>(
  options: T,
): FormEntryType<typeof options> {
  type R = FormEntryType<typeof options>;

  const { form, name, type, optional } = options;
  const value = form.get(name);

  if (!value) {
    if (optional) return undefined as R;
    throw new MissingFormEntryError(name);
  }

  if (type === "string") {
    if (typeof value !== "string")
      throw new ClientError(`Expected form entry "${name}" to be a string`);
    return value as R;
  }

  if (type === "boolean") {
    if (typeof value !== "string")
      throw new ClientError(`Expected form entry "${name}" to be a boolean string`);
    if (value !== "0" && value !== "1" && value !== "true" && value !== "false")
      throw new ClientError(`Expected form entry "${name}" to be a boolean string`);
    return (value === "1" || value === "true") as R;
  }

  if (!(value instanceof File)) throw new ClientError(`Expected form entry "${name}" to be a file`);

  return value as R;
}

export const getAllowedVersions = cached(60 * 60 * 1000, () => import("public/versions.json"));

export function cached<T>(timeoutMs: number, producer: () => Promise<T>): () => Promise<T> {
  let cachedData: T | undefined;
  let lastTime = 0;
  return async () => {
    const time = new Date().getTime();
    if (!cachedData || time - lastTime > timeoutMs) {
      cachedData = await producer();
      lastTime = time;
    }
    return cachedData;
  };
}

export * from "./email";
export * from "./errors";
export * from "./session";
export * from "./Version";
