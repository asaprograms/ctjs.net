import { Alert, Box, Divider, List, ListItem, ListItemContent, Typography } from "@mui/joy";

export const metadata = {
  title: "Publishing policy | CTJS",
  description:
    "How modules are reviewed, scanned, approved, and removed from the ctjs.net registry.",
};

export default function PublishingPolicyPage() {
  return (
    <Box component="article" sx={{ maxWidth: 780, mx: "auto", py: { xs: 2, md: 5 } }}>
      <Typography level="h1">Publishing policy</Typography>
      <Typography level="body-lg" sx={{ mt: 1, mb: 3 }}>
        The registry is curated. Publication is a review decision, not an automatic result of
        uploading a file.
      </Typography>

      <Typography level="h2" sx={{ mt: 3 }}>
        Application review
      </Typography>
      <Typography>
        New projects submit a public source repository, a clear description, and relevant
        implementation notes. A reviewer checks ownership, licensing, build provenance,
        dependencies, and whether the project is suitable for the registry. Approval creates a
        private module listing where the author can submit a first release.
      </Typography>

      <Typography level="h2" sx={{ mt: 3 }}>
        Release scanning
      </Typography>
      <Typography>
        Every uploaded archive is unpacked under strict size and path limits. The scanner records a
        SHA-256 digest and examines source files for process execution, credential access, webhooks,
        native libraries, reflection, dynamic code, direct Java access, network activity, encoded
        payloads, and executable files.
      </Typography>
      <Alert color="warning" variant="soft" sx={{ my: 2 }}>
        A clean scan is not proof that a module is safe. Scanner results are evidence for reviewers,
        not a replacement for source review.
      </Alert>

      <Typography level="h2" sx={{ mt: 3 }}>
        Manual review
      </Typography>
      <List marker="disc">
        <ListItem>
          <ListItemContent>Every release requires an explicit reviewer decision.</ListItemContent>
        </ListItem>
        <ListItem>
          <ListItemContent>
            Flagged releases require written reviewer notes before approval.
          </ListItemContent>
        </ListItem>
        <ListItem>
          <ListItemContent>
            Reviewers compare new releases with the previously approved source.
          </ListItemContent>
        </ListItem>
        <ListItem>
          <ListItemContent>
            Rejections include a reason that the author can address in a later submission.
          </ListItemContent>
        </ListItem>
      </List>

      <Divider sx={{ my: 3 }} />
      <Typography level="h2">Removal and quarantine</Typography>
      <Typography>
        Maintainers may quarantine a release immediately when credible security concerns arise.
        Listings may be removed for malware, concealed behavior, impersonation, license violations,
        misleading descriptions, review evasion, or repeated policy violations. Security reports
        should use the private reporting channel linked from the project repository.
      </Typography>
    </Box>
  );
}
