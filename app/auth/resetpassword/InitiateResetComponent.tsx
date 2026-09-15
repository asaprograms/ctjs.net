"use client";

import { Box, FormControl, FormLabel, Input, Sheet, Typography } from "@mui/joy";
import { isEmailValid } from "app/constants";
import { useState } from "react";

import ProviderButton from "../ProviderButton";

export default function InitiateResetComponent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const onSubmit = async () => {
    setLoading(true);
    setError(undefined);

    const data = new FormData();
    data.set("email", email);

    const response = await fetch("/api/account/resetpassword/request", {
      method: "POST",
      body: data,
    });

    if (response.ok) {
      setLoading(false);
      setDone(true);
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
          <Typography level="h3">Send Reset Password Email</Typography>
        </Box>
        <FormControl sx={{ mb: 2 }}>
          <FormLabel>Email</FormLabel>
          <Input
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => (e.key === "Enter" ? onSubmit() : undefined)}
          />
        </FormControl>
        <ProviderButton loading={loading} disabled={!isEmailValid(email)} onClick={onSubmit}>
          Send Reset Email
        </ProviderButton>
        {done && (
          <Sheet variant="solid" color="neutral" sx={{ px: 5, py: 1, borderRadius: 10 }}>
            <Typography>
              If a ChatTriggers account is associated with this email address, a reset email will be
              sent
            </Typography>
          </Sheet>
        )}
      </Sheet>
    </Box>
  );
}
