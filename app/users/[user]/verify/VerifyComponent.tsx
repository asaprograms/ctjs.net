"use client";

import { Box, Sheet, Typography } from "@mui/joy";

// This is only ever rendered if the verification succeeded, so it doesn't
// need any error checking or anything
export default function VerifyComponent({ ok }: { ok: boolean }) {
  return (
    <Box
      width="100%"
      mt={5}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      justifyItems="center"
      alignItems="center"
      alignContent="center"
    >
      <Sheet
        variant="soft"
        sx={{
          width: "100%",
          maxWidth: 700,
          borderRadius: 10,
          p: 3,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {ok ? (
          <Typography level="title-lg">Thank you for verifying your email!</Typography>
        ) : (
          <>
            <Typography level="title-lg" sx={{ pb: 1 }}>
              Failed to verify email address
            </Typography>
            <Typography level="body-lg">
              Please double-check you entered the correct URL received in the verification email.
            </Typography>
          </>
        )}
      </Sheet>
    </Box>
  );
}
