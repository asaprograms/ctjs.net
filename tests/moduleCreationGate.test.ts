import { describe, expect, it, vi } from "vitest";

vi.mock("app/api", () => ({
  ForbiddenError: class extends Error {
    statusCode = 403;
  },
  route: (handler: unknown) => handler,
}));
vi.mock("app/api/modules", () => ({ getManyPublic: vi.fn() }));

describe("module application gate", () => {
  it("rejects the legacy direct creation handler", async () => {
    const { PUT } = await import("../app/api/modules/route");
    await expect(PUT({} as never, {} as never)).rejects.toMatchObject({
      statusCode: 403,
      message: "Direct module creation is disabled. Submit an application at /apply.",
    });
  });
});
