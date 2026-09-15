"use client";

import { Box, Button, Sheet, Typography } from "@mui/joy";
import colors from "@mui/joy/colors";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutComponent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    await fetch("/api/account/logout", { method: "POST" });
    setLoading(false);
    // AppBar doesn't update without this refresh call
    router.push("/");
    router.refresh();
  };

  return (
    <Box
      width="100%"
      mt={10}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      justifyItems="center"
      alignItems="center"
      alignContent="center"
    >
      <Sheet variant="soft" sx={{ width: "100%", maxWidth: 400, borderRadius: 10, p: 3 }}>
        <Box mb={2} width="100%" display="flex" justifyContent="center">
          <Typography level="h3">Sign Out</Typography>
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignContent: "center",
            mt: 3,
            mb: 3,
          }}
        >
          <Typography>Are you sure?</Typography>
        </Box>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignContent: "center",
          }}
        >
          <Button
            sx={{
              mr: 2,
              width: "100%",
              color: colors.grey[100],
              backgroundColor: colors.green[700],
            }}
            onClick={() => router.back()}
          >
            No, take me back
          </Button>
          <Button
            sx={{
              ml: 2,
              width: "100%",
              color: colors.grey[100],
              backgroundColor: colors.red[700],
            }}
            loading={loading}
            onClick={handleSignOut}
          >
            Yes, sign me out
          </Button>
        </Box>
      </Sheet>
    </Box>
  );
}
