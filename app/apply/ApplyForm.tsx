"use client";

import {
  Alert,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Link,
  Sheet,
  Textarea,
  Typography,
} from "@mui/joy";
import { type FormEvent, useState } from "react";

export default function ApplyForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");
    const response = await fetch("/api/applications", {
      method: "POST",
      body: new FormData(event.currentTarget),
    });
    if (response.ok) {
      setStatus("success");
      setMessage("Application submitted. A reviewer will check the project and source repository.");
      event.currentTarget.reset();
      return;
    }
    setStatus("error");
    setMessage((await response.text()) || "The application could not be submitted.");
  };

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", py: { xs: 2, md: 5 } }}>
      <Typography level="h1" sx={{ mb: 1 }}>
        Submit a module
      </Typography>
      <Typography level="body-lg" sx={{ mb: 3 }}>
        Every module starts with a source review. Approved projects can upload releases, and every
        release must pass automated scanning and manual review before it appears publicly.
      </Typography>

      {status === "success" && (
        <Alert color="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}
      {status === "error" && (
        <Alert color="danger" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Sheet
        component="form"
        onSubmit={submit}
        variant="outlined"
        sx={{ p: { xs: 2, md: 3 }, borderRadius: "md", display: "grid", gap: 2 }}
      >
        <FormControl required>
          <FormLabel>Module name</FormLabel>
          <Input
            name="name"
            slotProps={{
              input: { minLength: 2, maxLength: 64, pattern: "[A-Za-z0-9][A-Za-z0-9_-]{1,63}" },
            }}
            placeholder="ExampleModule"
          />
          <FormHelperText>Letters, numbers, underscores, and hyphens.</FormHelperText>
        </FormControl>
        <FormControl required>
          <FormLabel>Summary</FormLabel>
          <Textarea
            name="summary"
            minRows={3}
            slotProps={{ textarea: { minLength: 20, maxLength: 300 } }}
            placeholder="What the module does and who it is for."
          />
        </FormControl>
        <FormControl required>
          <FormLabel>Public source repository</FormLabel>
          <Input name="sourceUrl" type="url" placeholder="https://github.com/owner/project" />
          <FormHelperText>Reviewers need the complete source and commit history.</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Notes for reviewers</FormLabel>
          <Textarea
            name="notes"
            minRows={4}
            slotProps={{ textarea: { maxLength: 4000 } }}
            placeholder="Dependencies, network services, native access, or anything else reviewers should know."
          />
        </FormControl>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography level="body-sm">
            By submitting, you agree to the <Link href="/publishing-policy">publishing policy</Link>
            .
          </Typography>
          <Button type="submit" loading={status === "submitting"}>
            Submit application
          </Button>
        </Box>
      </Sheet>
    </Box>
  );
}
