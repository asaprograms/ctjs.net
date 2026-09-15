"use client";

import { Box, FormControl, FormLabel, Input, Sheet, Typography } from "@mui/joy";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ProviderButton from "../ProviderButton";

export default function SignInComponent() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [apiError, setApiError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const onSignIn = async () => {
    setLoading(true);

    const data = new FormData();
    data.set("username", username);
    data.set("password", password);

    const response = await fetch("/api/account/login", {
      method: "POST",
      body: data,
    });

    if (response.ok) {
      setLoading(false);
      // AppBar doesn't update without this refresh call
      router.back();
      router.refresh();
      return;
    }

    const body = (await response.body?.getReader().read())?.value;
    setLoading(false);
    if (body) {
      setApiError(new TextDecoder().decode(body));
    } else {
      setApiError("Unknown error occurred");
    }
  };

  return (
    <Box
      width="100%"
      mt={5}
      display="flex"
      flexDirection="column"
      alignItems="center"
      alignContent="center"
    >
      {apiError && (
        <Sheet variant="solid" color="danger" sx={{ mb: 5, px: 5, py: 1, borderRadius: 10 }}>
          <Typography>{apiError}</Typography>
        </Sheet>
      )}
      <Sheet variant="soft" sx={{ width: "100%", maxWidth: 400, borderRadius: 10, p: 3 }}>
        <Box mb={2} width="100%" display="flex" justifyContent="center">
          <Typography level="h3">Log In</Typography>
        </Box>
        <FormControl sx={{ mb: 2 }}>
          <FormLabel>Username or Email</FormLabel>
          <Input
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => (e.key === "Enter" ? onSignIn() : undefined)}
          />
        </FormControl>
        <FormControl sx={{ mb: 2 }}>
          <FormLabel>Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => (e.key === "Enter" ? onSignIn() : undefined)}
          />
        </FormControl>
        <ProviderButton loading={loading} disabled={!username || !password} onClick={onSignIn}>
          Sign in
        </ProviderButton>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
          }}
        >
          <Link href="/auth/resetpassword" style={{ textDecoration: "none" }}>
            Reset password
          </Link>
          <Box>
            No account?{" "}
            <Link href="/auth/signup" style={{ textDecoration: "none" }}>
              Sign up
            </Link>
          </Box>
        </Box>
      </Sheet>
    </Box>
  );
}
