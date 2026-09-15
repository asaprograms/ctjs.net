import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  deleteRelease: vi.fn(),
  deleteWebhook: vi.fn(),
}));

vi.mock("app/api", () => ({
  ForbiddenError: class extends Error {},
  NotFoundError: class extends Error { statusCode = 404; },
  Rank: { default: "default" },
  Release: {},
  getSessionFromRequest: () => ({ id: "owner", rank: "default" }),
  route: (handler: unknown) => handler,
  db: { release: {
    findUnique: async () => ({ id: "foreign-release", moduleId: "other-module" }),
    delete: state.deleteRelease,
  } },
}));
vi.mock("app/api/modules", () => ({
  getOne: async () => ({ id: "owned-module", user: { id: "owner" } }),
}));
vi.mock("app/api/(utils)/webhooks", () => ({
  deleteReleaseVerificationMessage: state.deleteWebhook,
}));

describe("release deletion authorization", () => {
  it("does not let an owner delete a release belonging to another module", async () => {
    const { DELETE } = await import("../app/api/modules/[nameOrId]/releases/[releaseId]/route");
    await expect(DELETE({} as never, {
      params: { nameOrId: "owned-module", releaseId: "foreign-release" },
    })).rejects.toMatchObject({ statusCode: 404 });
    expect(state.deleteRelease).not.toHaveBeenCalled();
    expect(state.deleteWebhook).not.toHaveBeenCalled();
  });
});
