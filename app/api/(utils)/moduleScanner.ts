import { createHash } from "node:crypto";
import path from "node:path";
import type JSZip from "jszip";

export const SCANNER_VERSION = "1.0.0";

const MAX_FILES = 1_000;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

export type FindingSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface ScanFinding {
  rule: string;
  severity: FindingSeverity;
  file: string;
  line?: number;
  message: string;
  evidence?: string;
}

export interface ModuleScanResult {
  engineVersion: string;
  archiveSha256: string;
  score: number;
  status: "passed" | "flagged";
  summary: string;
  findings: ScanFinding[];
}

interface Rule {
  id: string;
  severity: FindingSeverity;
  message: string;
  expression: RegExp;
}

const rules: Rule[] = [
  {
    id: "process-execution",
    severity: "critical",
    message: "Starts or prepares an operating system process",
    expression:
      /(?:ProcessBuilder|Runtime\s*\.\s*getRuntime\s*\(\s*\)\s*\.\s*exec|child_process|cmd\.exe|powershell(?:\.exe)?)/i,
  },
  {
    id: "credential-access",
    severity: "critical",
    message: "References a common credential or session storage location",
    expression:
      /(?:Login\s*Data|Local\s*State|\.ssh[\\/]|\.aws[\\/]|discord(?:canary|ptb)?[\\/].*Local Storage|launcher_accounts\.json)/i,
  },
  {
    id: "webhook-exfiltration",
    severity: "critical",
    message: "Contains a Discord webhook URL",
    expression: /https?:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\//i,
  },
  {
    id: "native-library-loading",
    severity: "high",
    message: "Loads a native library",
    expression: /System\s*\.\s*load(?:Library)?\s*\(/,
  },
  {
    id: "reflection",
    severity: "medium",
    message: "Uses reflection or changes member accessibility",
    expression:
      /(?:Class\s*\.\s*forName|setAccessible\s*\(|getDeclared(?:Field|Method|Constructor)\s*\()/,
  },
  {
    id: "dynamic-code",
    severity: "medium",
    message: "Evaluates dynamically constructed code",
    expression: /(?:\beval\s*\(|new\s+Function\s*\(|Function\s*\(\s*["'`])/,
  },
  {
    id: "java-bridge",
    severity: "low",
    message: "Accesses Java classes directly",
    expression: /Java\s*\.\s*type\s*\(/,
  },
  {
    id: "external-network",
    severity: "low",
    message: "Makes or prepares an external network request",
    expression: /(?:fetch\s*\(|XMLHttpRequest|HttpURLConnection|new\s+URL\s*\(|WebSocket\s*\()/,
  },
  {
    id: "encoded-payload",
    severity: "medium",
    message: "Contains a long encoded payload",
    expression: /(?:[A-Za-z0-9+/]{800,}={0,2}|(?:\\x[0-9a-fA-F]{2}){80,})/,
  },
];

const severityWeight: Record<FindingSeverity, number> = {
  info: 0,
  low: 4,
  medium: 12,
  high: 30,
  critical: 60,
};

const textExtensions = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".jsx",
  ".json",
  ".md",
  ".txt",
  ".properties",
  ".toml",
  ".yml",
  ".yaml",
]);

const executableExtensions = new Set([
  ".exe",
  ".dll",
  ".class",
  ".jar",
  ".com",
  ".scr",
  ".bat",
  ".cmd",
  ".ps1",
  ".vbs",
  ".sh",
]);

export async function scanModuleArchive(
  zip: JSZip,
  originalArchive: ArrayBuffer,
): Promise<ModuleScanResult> {
  const findings: ScanFinding[] = [];
  const entries = Object.values(zip.files).filter(entry => !entry.dir);

  if (entries.length > MAX_FILES) {
    throw new Error(`Archive contains ${entries.length} files; maximum is ${MAX_FILES}`);
  }

  let totalBytes = 0;
  for (const entry of entries) {
    const originalName = (entry as typeof entry & { unsafeOriginalName?: string }).unsafeOriginalName ?? entry.name;
    const portableName = originalName.replaceAll("\\", "/");
    const normalized = path.posix.normalize(portableName);
    if (portableName.split("/").includes("..") || normalized.startsWith("/") || /^[a-z]:/i.test(normalized) || normalized.includes("\0")) {
      throw new Error(`Archive contains an unsafe path: ${entry.name}`);
    }

    const data = await entry.async("uint8array");
    totalBytes += data.byteLength;
    if (data.byteLength > MAX_FILE_BYTES) {
      findings.push({
        rule: "large-file",
        severity: "high",
        file: normalized,
        message: `File is larger than ${MAX_FILE_BYTES / 1024 / 1024} MiB`,
      });
    }
    if (totalBytes > MAX_TOTAL_BYTES) {
      throw new Error(`Expanded archive is larger than ${MAX_TOTAL_BYTES / 1024 / 1024} MiB`);
    }

    const extension = path.posix.extname(normalized).toLowerCase();
    if (executableExtensions.has(extension)) {
      findings.push({
        rule: "executable-payload",
        severity: "critical",
        file: normalized,
        message: `Archive contains an executable payload (${extension})`,
      });
      continue;
    }
    if (!textExtensions.has(extension)) continue;

    const source = new TextDecoder("utf-8", { fatal: false }).decode(data);
    const lines = source.split(/\r?\n/);
    for (const rule of rules) {
      for (let index = 0; index < lines.length; index += 1) {
        const match = rule.expression.exec(lines[index]);
        rule.expression.lastIndex = 0;
        if (!match) continue;
        findings.push({
          rule: rule.id,
          severity: rule.severity,
          file: normalized,
          line: index + 1,
          message: rule.message,
          evidence: redactEvidence(match[0]),
        });
      }
    }
  }

  const rawScore = findings.reduce((total, finding) => total + severityWeight[finding.severity], 0);
  const score = Math.min(100, rawScore);
  const criticalCount = findings.filter(finding => finding.severity === "critical").length;
  const highCount = findings.filter(finding => finding.severity === "high").length;
  const status = criticalCount > 0 || highCount > 0 || score >= 25 ? "flagged" : "passed";

  return {
    engineVersion: SCANNER_VERSION,
    archiveSha256: createHash("sha256").update(new Uint8Array(originalArchive)).digest("hex"),
    score,
    status,
    summary:
      findings.length === 0
        ? "No static-analysis findings"
        : `${findings.length} finding${findings.length === 1 ? "" : "s"}: ${criticalCount} critical, ${highCount} high`,
    findings,
  };
}

function redactEvidence(value: string): string {
  if (/discord(?:app)?\.com\/api\/webhooks/i.test(value)) return "Discord webhook URL redacted";
  return value.slice(0, 160);
}
