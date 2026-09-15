"use client";

import { Box, Stack } from "@mui/joy";
import { AppBar } from "@mui/material";
import type { AuthenticatedUser } from "app/api";
import { usePathname } from "next/navigation";
import type React from "react";

import AppBarIcons from "./AppBarIcons";
import CTLogo from "./CTLogo";
import SearchBar from "./SearchBar";

interface Props {
  user?: AuthenticatedUser;
  children: React.ReactNode;
}

export default function _AppBar({ user, children }: Props) {
  if (usePathname() === "/") return children;

  return (
    <>
      <AppBar
        position="static"
        sx={{
          backgroundColor: "#7e57c2",
          display: "flex",
          width: "100%",
          flexDirection: "row",
          alignContent: "center",
          alignItems: "center",
          justifyItems: "center",
          justifyContent: "center",
          py: 1,
        }}
      >
        <Stack
          direction="row"
          px={2}
          maxWidth={1000}
          width="100%"
          display="flex"
          alignContent="center"
          alignItems="center"
          justifyContent="space-between"
          justifyItems="center"
          flexWrap="wrap"
        >
          <CTLogo />
          <SearchBar
            sx={{
              alignSelf: "center",
              justifySelf: "center",
              mx: { mobile: 0, tablet: 6 },
              pt: { mobile: 1, tablet: 0 },
              flexGrow: 1,
              order: { mobile: 3, tablet: 0 },
              minWidth: { mobile: 300, tablet: 0 },
            }}
          />
          <AppBarIcons user={user} />
        </Stack>
      </AppBar>

      <Box display="flex" justifyContent="center">
        <Box maxWidth={1000} width="100%" p={2}>
          {children}
        </Box>
      </Box>
    </>
  );
}
