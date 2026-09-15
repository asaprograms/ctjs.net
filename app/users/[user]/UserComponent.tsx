"use client";

import { Download, Edit, EventNote } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  Option,
  Select,
  Sheet,
  Stack,
  Tooltip,
  Typography,
} from "@mui/joy";
import { Pagination } from "@mui/material";
import type { AuthenticatedUser, PublicUser, Sort } from "app/api";
import type { ManyResponsePublic } from "app/api/modules";
import { isUsernameValid } from "app/constants";
import Header from "app/modules/Header";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";

const MODULES_PER_PAGES = 25;
const SECONDS_PER_MONTH = 60 * 60 * 24 * 30;

interface UserProps {
  user: PublicUser;
  totalDownloads: number;

  // If this is true, the user is looking at their own page and should have
  // some extra options. Implies user is AuthenticatedUser
  authenticated: boolean;

  modules: ManyResponsePublic;
}

function UserHeader({ user, totalDownloads, authenticated }: UserProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(
    user.image ? `${process.env.NEXT_PUBLIC_WEB_ROOT}/${user.image}` : null,
  );
  const [username, setUsername] = useState(user.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const inputRef = useRef<HTMLInputElement | null>(null);

  let canChangeName = false;
  if (authenticated) {
    const lastChangeTime = (user as AuthenticatedUser).last_name_change_time;
    if (!lastChangeTime) {
      canChangeName = true;
    } else {
      const diff = new Date().getTime() - lastChangeTime.getTime();
      canChangeName = diff > SECONDS_PER_MONTH;
    }
  }

  const usernameIsValid = isUsernameValid(username);
  const hasChanges = avatarSrc !== undefined || username !== user.name;

  const handleAvatarClick = () => inputRef.current?.click();

  const handleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const file = e.target.files?.[0];
    if (file) {
      setAvatarSrc(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(undefined);

    const formData = new FormData();
    if (canChangeName && username !== user.name) formData.append("username", username);
    if (avatarSrc !== user.image) {
      const file = inputRef.current?.files?.[0];
      if (file) formData.append("image", file);
    }

    const res = await fetch("/api/account/modify", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      setEditOpen(false);
      setLoading(false);

      // Redirect to the new user page
      router.push(`/users/${username}`);
      return;
    }

    const body = (await res.body?.getReader().read())?.value;
    setLoading(false);
    if (body) {
      setError(new TextDecoder().decode(body));
    } else {
      setError("Unknown error occurred");
    }
  };

  return (
    <>
      <Sheet variant="soft" sx={{ padding: 2, borderRadius: 4, mb: 3 }}>
        <Stack direction={{ mobile: "column", tablet: "row" }} justifyContent="space-between">
          <Stack direction="row" spacing={2} ml={1} alignItems="center">
            <Typography level="h2" fontSize={{ mobile: 16, tablet: 30 }} noWrap>
              {user.name}
            </Typography>
            {authenticated && (
              <Box pl={3}>
                <Button
                  color="secondary"
                  size="sm"
                  startDecorator={<Edit />}
                  onClick={() => setEditOpen(true)}
                >
                  Edit Profile
                </Button>
              </Box>
            )}
          </Stack>
          <Stack direction="row">
            {user.image && (
              <Box display={{ mobile: "none", tablet: "flex" }} alignItems="center" mx={3}>
                <img
                  src={`${process.env.NEXT_PUBLIC_WEB_ROOT}/${user.image}`}
                  alt="user icon"
                  style={{
                    maxHeight: 100,
                    objectFit: "contain",
                    maxWidth: 250,
                    borderRadius: 6,
                  }}
                />
              </Box>
            )}
            <Stack
              display={{ mobile: "none", desktop: "flex" }}
              alignItems="start"
              mr={3}
              justifyContent="center"
              spacing={2}
            >
              <Box display="flex" flexDirection="row" alignContent="center" alignItems="center">
                <Download fontSize="small" />
                <Typography pl={1} level="body-sm" whiteSpace="nowrap">
                  Downloads: {totalDownloads.toLocaleString()}
                </Typography>
              </Box>
              <Tooltip
                suppressHydrationWarning
                title={new Date(user.created_at).toLocaleTimeString()}
                placement="top"
                arrow
              >
                <Box display="flex" flexDirection="row" alignContent="center" alignItems="center">
                  <EventNote fontSize="small" />
                  <Typography pl={1} suppressHydrationWarning level="body-sm" whiteSpace="nowrap">
                    Created: {new Date(user.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
      </Sheet>
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        sx={{ width: "100%", height: "100%" }}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignContent="center"
          alignItems="center"
          justifyContent="center"
          justifyItems="center"
          overflow="hidden"
          sx={{
            position: "absolute" as const,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: 10,
          }}
        >
          {error && (
            <Sheet variant="solid" color="danger" sx={{ mb: 5, px: 5, py: 1, borderRadius: 10 }}>
              <Typography>{error}</Typography>
            </Sheet>
          )}
          <Sheet sx={{ p: 6, borderRadius: 10, width: 400 }}>
            <Box width="100%" display="flex" justifyContent="center" mb={1}>
              <Box onClick={handleAvatarClick} sx={{ cursor: "pointer" }}>
                <Avatar
                  src={avatarSrc ?? undefined}
                  sx={{
                    width: 128,
                    height: 128,
                  }}
                />
                <input
                  type="file"
                  id="file"
                  ref={inputRef}
                  onChange={handleChangeFile}
                  style={{ display: "none" }}
                />
                <Avatar
                  size="sm"
                  sx={{
                    position: "relative",
                    left: 87,
                    top: -32,
                    backgroundColor: theme => theme.vars.palette.neutral[500],
                  }}
                >
                  <Edit fontSize="small" />
                </Avatar>
              </Box>
            </Box>
            <FormControl sx={{ mb: 3 }}>
              <FormLabel>Username</FormLabel>
              <Input
                value={username}
                error={!usernameIsValid}
                onChange={e => setUsername(e.target.value)}
                disabled={!canChangeName}
              />
              {!canChangeName && (
                <FormHelperText>Username can only be changed once every 30 days</FormHelperText>
              )}
              {!usernameIsValid && (
                <FormHelperText>
                  Username must be between 3 and 24 characters long and consist only of letters,
                  numbers, and underscores
                </FormHelperText>
              )}
            </FormControl>
            <Stack direction="row" spacing={2} width="100%">
              <Button
                color="danger"
                variant="soft"
                sx={{ flexGrow: 1 }}
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                color="success"
                variant="soft"
                sx={{ flexGrow: 1 }}
                onClick={handleSubmit}
                loading={loading}
                disabled={!hasChanges}
              >
                Save
              </Button>
            </Stack>
          </Sheet>
        </Box>
      </Modal>
    </>
  );
}

export default function UserComponent(props: UserProps) {
  const { modules } = props;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChangePage = (_event: unknown, newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("offset", ((newPage - 1) * MODULES_PER_PAGES).toString());
    router.replace(`${pathname}?${newParams}`);
  };

  const handleChangeSort = (_event: unknown, newSort: Sort | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (newSort) {
      newParams.set("sort", newSort);
    } else {
      newParams.delete("sort");
    }
    router.replace(`${pathname}?${newParams}`);
  };

  return (
    <Stack my={2}>
      <UserHeader {...props} />
      <Stack
        direction={{ mobile: "column", tablet: "row" }}
        alignItems="center"
        mx={{ mobile: 0, tablet: 5, desktop: 0 }}
        mb={2}
        justifyContent="space-between"
      >
        {modules.meta.total > MODULES_PER_PAGES ? (
          <Pagination
            count={Math.ceil(modules.meta.total / MODULES_PER_PAGES)}
            defaultPage={Math.floor(modules.meta.offset / MODULES_PER_PAGES) + 1}
            onChange={handleChangePage}
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
              defaultValue={modules.meta.sort}
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
      {modules.modules.map(module => {
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
              <Header module={module} hideUser ownerView={false} />
            </Link>
          </Box>
        );
      })}
    </Stack>
  );
}
