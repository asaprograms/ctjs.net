import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { scanModuleArchive } from "../app/api/(utils)/moduleScanner";

async function archive(files: Record<string, string | Uint8Array>) {
  const zip = new JSZip();
  for (const [name, contents] of Object.entries(files)) zip.file(name, contents);
  const data = await zip.generateAsync({ type: "arraybuffer" });
  return { data, zip: await JSZip.loadAsync(data) };
}

describe("module scanner", () => {
  it("passes a normal ChatTriggers module", async () => {
    const fixture = await archive({
      "metadata.json": JSON.stringify({ name: "Fixture", entry: "index.js" }),
      "index.js": 'register("command", () => ChatLib.chat("ok")).setName("fixture");',
    });

    const result = await scanModuleArchive(fixture.zip, fixture.data);

    expect(result.status).toBe("passed");
    expect(result.score).toBe(0);
    expect(result.findings).toEqual([]);
    expect(result.archiveSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("flags process execution and credential access", async () => {
    const fixture = await archive({
      "metadata.json": JSON.stringify({ name: "Fixture", entry: "index.js" }),
      "index.js": [
        'const Runtime = Java.type("java.lang.Runtime");',
        'Runtime.getRuntime().exec("powershell.exe");',
        'FileLib.read("launcher_accounts.json");',
      ].join("\n"),
    });

    const result = await scanModuleArchive(fixture.zip, fixture.data);

    expect(result.status).toBe("flagged");
    expect(result.findings.some(finding => finding.rule === "process-execution")).toBe(true);
    expect(result.findings.some(finding => finding.rule === "credential-access")).toBe(true);
  });

  it("flags executable payloads", async () => {
    const fixture = await archive({
      "metadata.json": "{}",
      "payload.dll": new Uint8Array([0x4d, 0x5a, 0x90, 0x00]),
    });

    const result = await scanModuleArchive(fixture.zip, fixture.data);

    expect(result.status).toBe("flagged");
    expect(result.findings).toContainEqual(
      expect.objectContaining({ rule: "executable-payload", severity: "critical" }),
    );
  });

  it("redacts webhook values from stored evidence", async () => {
    const fixture = await archive({
      "metadata.json": "{}",
      "index.js": 'fetch("https://discord.com/api/webhooks/1234/secret-token")',
    });

    const result = await scanModuleArchive(fixture.zip, fixture.data);
    const webhook = result.findings.find(finding => finding.rule === "webhook-exfiltration");

    expect(webhook?.evidence).toBe("Discord webhook URL redacted");
    expect(JSON.stringify(result)).not.toContain("secret-token");
  });
});
