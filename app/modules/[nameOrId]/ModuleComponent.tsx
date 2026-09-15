"use client";

import { Box } from "@mui/joy";
import type { AuthenticatedUser, PublicModule } from "app/api";

import Body from "../Body";
import Header from "../Header";

interface Props {
  module: PublicModule;
  user?: AuthenticatedUser;
}

export default function Module({ module, user }: Props) {
  const isOwner = module.owner.id === user?.id && user?.email_verified === true;

  return (
    <Box my={{ md: 5 }} width="100%">
      <Header module={module} ownerView={isOwner} />
      <Body module={module} ownerView={isOwner} />
    </Box>
  );
}
