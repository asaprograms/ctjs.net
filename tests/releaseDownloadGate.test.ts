import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ readFile: vi.fn(), moduleUpdate: vi.fn(), releaseUpdate: vi.fn() }));
vi.mock("node:fs/promises", () => ({ readFile: state.readFile }));
vi.mock("app/api", () => ({
  db: {
    module: { update: state.moduleUpdate },
    release: { update: state.releaseUpdate, findMany: vi.fn() },
  },
}));
vi.mock("app/api/modules", () => ({}));

describe("release download gate", () => {
  it.each([
    { verified: false, reviewStatus: "pending" },
    { verified: false, reviewStatus: "rejected" },
    { verified: true, reviewStatus: "pending" },
  ])("does not expose an unapproved archive: $reviewStatus", async releaseState => {
    const { getScripts } = await import("../app/api/modules/[nameOrId]/releases");
    const module = {
      id: "module", name: "Fixture",
      releases: [{ id: "release", ...releaseState }],
    };
    expect(await getScripts(module as never, "release")).toBeUndefined();
    expect(state.readFile).not.toHaveBeenCalled();
    expect(state.moduleUpdate).not.toHaveBeenCalled();
    expect(state.releaseUpdate).not.toHaveBeenCalled();
  });

  it("serves and counts an approved archive", async () => {
    state.readFile.mockResolvedValueOnce(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    const { getScripts } = await import("../app/api/modules/[nameOrId]/releases");
    const module = {
      id: "module", name: "Fixture",
      releases: [{ id: "approved", verified: true, reviewStatus: "approved" }],
    };
    expect(await getScripts(module as never, "approved")).toEqual(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
    expect(state.moduleUpdate).toHaveBeenCalledOnce();
    expect(state.releaseUpdate).toHaveBeenCalledOnce();
  });
});
