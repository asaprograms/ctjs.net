"use client";

import { Box, FormControl, FormLabel, Input, Sheet, Typography } from "@mui/joy";
import { isPasswordValid } from "app/constants";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ProviderButton from "../ProviderButton";

interface Props {
  token: string;
  email: string;
}

export default function ResetPasswordComponent({ token, email }: Props) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const passwordValid = isPasswordValid(password);
  const password2Valid = passwordValid && password === password2;
  const canSubmit = passwordValid && password2Valid;

  const onSignIn = async () => {
    setLoading(true);
    setError(undefined);

    const data = new FormData();
    data.set("email", email);
    data.set("password", password);
    data.set("token", token);

    const response = await fetch("/api/account/resetpassword/complete", {
      method: "POST",
      body: data,
    });

    if (response.ok) {
      setLoading(true);

      // AppBar doesn't update without this refresh call
      router.push("/");
      return;
    }

    const body = (await response.body?.getReader().read())?.value;
    setLoading(false);
    if (body) {
      setError(new TextDecoder().decode(body));
    } else {
      setError("Unknown error occurred");
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
      {error && (
        <Sheet variant="solid" color="danger" sx={{ mb: 5, px: 5, py: 1, borderRadius: 10 }}>
          <Typography>{error}</Typography>
        </Sheet>
      )}
      <Sheet variant="soft" sx={{ width: "100%", maxWidth: 400, borderRadius: 10, p: 3 }}>
        <Box mb={2} width="100%" display="flex" justifyContent="center">
          <Typography level="h3">Reset Password</Typography>
        </Box>
        <FormControl sx={{ mb: 2 }}>
          <FormLabel>Email</FormLabel>
          <Input value={email} disabled />
        </FormControl>
        <FormControl sx={{ mb: 2 }}>
          <FormLabel>New Password</FormLabel>
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => (e.key === "Enter" && canSubmit ? onSignIn() : undefined)}
            error={!passwordValid}
          />
        </FormControl>
        <FormControl sx={{ mb: 2 }}>
          <FormLabel>Repeat New Password</FormLabel>
          <Input
            type="password"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            onKeyDown={e => (e.key === "Enter" && canSubmit ? onSignIn() : undefined)}
            error={!password2Valid}
          />
        </FormControl>
        <ProviderButton loading={loading} onClick={onSignIn} disabled={!canSubmit}>
          Reset Password
        </ProviderButton>
      </Sheet>
    </Box>
  );
}
