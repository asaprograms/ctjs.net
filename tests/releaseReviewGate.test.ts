import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  scanStatus: "pending",
  scanReport: null as object | null,
  transaction: vi.fn(),
  readForm: vi.fn(),
}));
vi.mock("app/(utils)", () => ({ isEmailVerified: () => true }));
vi.mock("app/api/(utils)/webhooks", () => ({ deleteReleaseVerificationMessage: vi.fn() }));
vi.mock("app/api", () => {
  class ApiError extends Error { statusCode = 409; }
  return {
    ClientError: ApiError, ConflictError: ApiError, ForbiddenError: ApiError,
    NotAuthenticatedError: ApiError, NotFoundError: ApiError,
    Rank: { default: "default" },
    route: (handler: unknown) => handler,
    getSessionFromRequest: () => ({ id: "reviewer", rank: "admin" }),
    getFormData: state.readForm,
    getFormEntry: vi.fn(),
    db: {
      user: { getFromSession: async () => ({ id: "reviewer" }) },
      release: { findUnique: async () => ({
        id: "release", verified: false, scanStatus: state.scanStatus, scanReport: state.scanReport,
      }) },
      $transaction: state.transaction,
    },
  };
});

describe("release review scan gate", () => {
  it.each(["pending", "failed"])("rejects review when scan status is %s", async status => {
    state.scanStatus = status;
    const { POST } = await import("../app/api/modules/[nameOrId]/releases/[releaseId]/verify/route");
    await expect(POST({} as never, { params: { nameOrId: "Fixture", releaseId: "release" } }))
      .rejects.toMatchObject({ message: "Release scanning must complete before manual review" });
    expect(state.readForm).not.toHaveBeenCalled();
    expect(state.transaction).not.toHaveBeenCalled();
  });
});
