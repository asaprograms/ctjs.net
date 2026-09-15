"use client";

import { Box, FormControl, FormLabel, Option, Select, Stack, Typography } from "@mui/joy";
import { Pagination } from "@mui/material";
import type { Sort } from "app/api";
import type { ManyResponsePublic } from "app/api/modules";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import Header from "./Header";

export const MODULES_PER_PAGES = 50;

export default function ModulesComponent({
  modules,
  meta: { total, offset, sort },
}: ManyResponsePublic) {
  const router = useRouter();
  const params = useSearchParams();

  const handleChangePage = (_event: unknown, newPage: number) => {
    const newParams = new URLSearchParams(params);
    newParams.set("offset", ((newPage - 1) * MODULES_PER_PAGES).toString());
    router.replace(`/modules?${newParams}`);
  };

  const handleChangeSort = (_event: unknown, newSort: Sort | null) => {
    const newParams = new URLSearchParams(params);
    if (newSort) {
      newParams.set("sort", newSort);
    } else {
      newParams.delete("sort");
    }
    router.replace(`/modules?${newParams}`);
  };

  return (
    <Stack my={2}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          mb: 3,
        }}
      >
        <Typography level="h2">All Modules</Typography>
      </Box>
      <Stack
        direction={{ mobile: "column", tablet: "row" }}
        alignItems="center"
        mx={{ mobile: 0, tablet: 5, desktop: 0 }}
        mb={2}
        justifyContent="space-between"
      >
        {total > MODULES_PER_PAGES ? (
          <Pagination
            count={Math.ceil(total / MODULES_PER_PAGES)}
            defaultPage={Math.floor(offset / MODULES_PER_PAGES) + 1}
            onChange={handleChangePage}
            sx={{ mb: { mobile: 2, tablet: 0 } }}
          />
        ) : (
          <div />
        )}
        <FormControl>
          <Stack direction="row" spacing={1}>
            <FormLabel style={{ alignSelf: "center" }} htmlFor="sort-by-select">
              Sort by
            </FormLabel>
            <Select
              defaultValue={sort}
              slotProps={{ button: { id: "sort-by-select" } }}
              onChange={handleChangeSort}
            >
              <Option value="DATE_CREATED_DESC">🡣 Date</Option>
              <Option value="DATE_CREATED_ASC">🡡 Date</Option>
              <Option value="DOWNLOADS_DESC">🡣 Downloads</Option>
              <Option value="DOWNLOADS_ASC">🡡 Downloads</Option>
            </Select>
          </Stack>
        </FormControl>
      </Stack>
      {modules.map(module => {
        return (
          <Box key={module.id} width="100%" my={1}>
            <Link
              href={`/modules/${module.name}`}
              style={{
                textDecoration: "none",
                color: "inherit",
                outline: 0,
                cursor: "pointer",
              }}
            >
              <Header module={module} ownerView={false} />
            </Link>
          </Box>
        );
      })}
    </Stack>
  );
}
