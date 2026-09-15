import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("public release visibility", () => {
  it("requires both verification and approval in public module data", async () => {
    const source = await readFile("app/api/index.ts", "utf8");

    expect(source).toContain('r.verified && r.reviewStatus === "approved"');
  });

  it("only lists modules with an approved verified release", async () => {
    const source = await readFile("app/api/modules/index.ts", "utf8");

    expect(source).toContain('some: { verified: true, reviewStatus: "approved" }');
  });

  it("uses the same approval rule for homepage module lists", async () => {
    const source = await readFile("app/page.tsx", "utf8");
    const approvalFilters = source.match(/reviewStatus: "approved"/g) ?? [];

    expect(approvalFilters).toHaveLength(3);
  });

  it("does not make the homepage depend on the GitHub API", async () => {
    const source = await readFile("app/page.tsx", "utf8");

    expect(source).not.toContain("Octokit");
    expect(source).not.toContain("repos.listReleases");
  });
});
