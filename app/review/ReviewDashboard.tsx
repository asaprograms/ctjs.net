"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Link,
  Sheet,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Textarea,
  Typography,
} from "@mui/joy";
import { useCallback, useEffect, useState } from "react";

interface Application {
  id: string;
  name: string;
  summary: string;
  sourceUrl: string;
  notes?: string;
  submittedBy: string;
  submittedAt: number;
}

interface ScanFinding {
  rule: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  file: string;
  line?: number;
  message: string;
  evidence?: string;
}

interface Release {
  id: string;
  moduleId: string;
  moduleName: string;
  owner: string;
  releaseVersion: string;
  modVersion: string;
  changelog?: string;
  submittedAt: number;
  scan: null | {
    status: "passed" | "flagged" | "failed" | "pending";
    score: number;
    summary: string;
    sha256: string;
    findings: ScanFinding[];
  };
}

export default function ReviewDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const [applicationsResponse, releasesResponse] = await Promise.all([
      fetch("/api/applications"),
      fetch("/api/review/releases"),
    ]);
    if (!applicationsResponse.ok || !releasesResponse.ok) {
      setError("Reviewer access is required to view this page.");
      return;
    }
    setApplications(await applicationsResponse.json());
    setReleases(await releasesResponse.json());
    setError("");
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const reviewApplication = async (application: Application, approved: boolean) => {
    const reason = window.prompt(approved ? "Reviewer notes (optional)" : "Rejection reason");
    if (!approved && !reason) return;
    const form = new FormData();
    form.set("decision", approved ? "approved" : "rejected");
    if (reason) form.set("reason", reason);
    const response = await fetch(`/api/applications/${application.id}/review`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      setError(await response.text());
      return;
    }
    await refresh();
  };

  const reviewRelease = async (release: Release, approved: boolean) => {
    const reason = window.prompt(
      approved && release.scan?.status === "flagged"
        ? "Explain why the flagged release is safe to approve"
        : approved
          ? "Reviewer notes (optional)"
          : "Rejection reason",
    );
    if ((!approved || release.scan?.status === "flagged") && !reason) return;
    const form = new FormData();
    form.set("verified", String(approved));
    if (reason) form.set("reason", reason);
    const response = await fetch(`/api/modules/${release.moduleId}/releases/${release.id}/verify`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      setError(await response.text());
      return;
    }
    await refresh();
  };

  if (error) return <Alert color="danger">{error}</Alert>;

  return (
    <Box sx={{ py: 2 }}>
      <Typography level="h1">Review queue</Typography>
      <Typography level="body-lg" sx={{ mt: 1, mb: 3 }}>
        Decisions are recorded with the reviewer account and retained for audit history.
      </Typography>
      <Tabs defaultValue={0}>
        <TabList>
          <Tab>Applications ({applications.length})</Tab>
          <Tab>Releases ({releases.length})</Tab>
        </TabList>
        <TabPanel value={0} sx={{ px: 0 }}>
          <Stack spacing={2}>
            {applications.length === 0 && (
              <Sheet variant="soft" sx={{ p: 3 }}>
                No module applications are waiting.
              </Sheet>
            )}
            {applications.map(application => (
              <Card key={application.id} variant="outlined">
                <Typography level="title-lg">{application.name}</Typography>
                <Typography level="body-sm">
                  Submitted by {application.submittedBy} on{" "}
                  {new Date(application.submittedAt).toLocaleString()}
                </Typography>
                <Typography>{application.summary}</Typography>
                <Link href={application.sourceUrl} target="_blank" rel="noreferrer">
                  Open source repository
                </Link>
                {application.notes && (
                  <Typography level="body-sm">
                    Reviewer notes from author: {application.notes}
                  </Typography>
                )}
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    color="danger"
                    variant="outlined"
                    onClick={() => void reviewApplication(application, false)}
                  >
                    Reject
                  </Button>
                  <Button color="success" onClick={() => void reviewApplication(application, true)}>
                    Approve
                  </Button>
                </Stack>
              </Card>
            ))}
          </Stack>
        </TabPanel>
        <TabPanel value={1} sx={{ px: 0 }}>
          <Stack spacing={2}>
            {releases.length === 0 && (
              <Sheet variant="soft" sx={{ p: 3 }}>
                No releases are waiting.
              </Sheet>
            )}
            {releases.map(release => (
              <Card key={release.id} variant="outlined">
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  gap={1}
                >
                  <Box>
                    <Typography level="title-lg">
                      {release.moduleName} {release.releaseVersion}
                    </Typography>
                    <Typography level="body-sm">
                      {release.owner} · CT {release.modVersion} ·{" "}
                      {new Date(release.submittedAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip
                    color={
                      release.scan?.status === "passed"
                        ? "success"
                        : release.scan?.status === "flagged"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {release.scan
                      ? `${release.scan.status} · score ${release.scan.score}`
                      : "scan pending"}
                  </Chip>
                </Stack>
                {release.changelog && <Typography>{release.changelog}</Typography>}
                {release.scan && (
                  <Box>
                    <Typography level="body-sm">
                      SHA-256: <code>{release.scan.sha256}</code>
                    </Typography>
                    <Typography level="body-sm">{release.scan.summary}</Typography>
                    {release.scan.findings.map((finding, index) => (
                      <Typography
                        key={`${finding.rule}-${finding.file}-${index}`}
                        level="body-sm"
                        color={finding.severity === "critical" ? "danger" : "neutral"}
                      >
                        [{finding.severity}] {finding.file}
                        {finding.line ? `:${finding.line}` : ""} · {finding.message}
                      </Typography>
                    ))}
                  </Box>
                )}
                <Divider />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    color="danger"
                    variant="outlined"
                    onClick={() => void reviewRelease(release, false)}
                  >
                    Reject
                  </Button>
                  <Button color="success" onClick={() => void reviewRelease(release, true)}>
                    Approve
                  </Button>
                </Stack>
              </Card>
            ))}
          </Stack>
        </TabPanel>
      </Tabs>
    </Box>
  );
}
