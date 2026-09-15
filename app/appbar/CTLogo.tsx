"use client";

import { Box, Typography } from "@mui/joy";
import Link from "next/link";
import logo from "public/logo.png";

export default function CTLogo() {
  return (
    <Link
      href="/"
      style={{
        textDecoration: "none",
        color: "inherit",
        outline: 0,
        cursor: "pointer",
      }}
    >
      <Box height={40} display="flex" flexDirection="row" alignContent="center" alignItems="center">
        <img src={logo.src} alt="chattriggers logo" height="100%" />
        <Typography
          level="h4"
          sx={{
            ml: 2,
            display: { mobile: "none", tablet: "initial" },
            color: "white",
          }}
        >
          ChatTriggers
        </Typography>
      </Box>
    </Link>
  );
}
