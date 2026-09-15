"use client";

import { Box, Sheet, Typography } from "@mui/joy";

export default function InvalidTokenComponent() {
  return (
    <Box
      width="100%"
      mt={5}
      display="flex"
      flexDirection="column"
      alignItems="center"
      alignContent="center"
    >
      <Sheet variant="solid" color="danger" sx={{ mb: 5, px: 5, py: 1, borderRadius: 10 }}>
        <Typography>
          Invalid reset token. If you recently requested a password reset, please recheck your email
          for the most recent link
        </Typography>
      </Sheet>
    </Box>
  );
}
