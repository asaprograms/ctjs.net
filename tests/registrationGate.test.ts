import { describe, expect, it, vi } from "vitest";

vi.mock("app/api", () => ({
  ForbiddenError: class extends Error {
    statusCode = 403;
  },
  route: (handler: unknown) => handler,
}));

describe("registration gate", () => {
  it("keeps registration closed until email delivery is configured", async () => {
    vi.stubEnv("REGISTRATION_ENABLED", "false");
    const { PUT } = await import("../app/api/account/new/route");

    await expect(PUT({} as never, {} as never)).rejects.toMatchObject({
      statusCode: 403,
      message: "Registration is temporarily closed",
    });
  });
});
