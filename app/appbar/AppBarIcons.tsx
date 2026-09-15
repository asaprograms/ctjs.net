"use client";

import { AccountCircle, AddBox, Logout, PriorityHigh } from "@mui/icons-material";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Dropdown,
  IconButton,
  Link,
  ListItemDecorator,
  Menu,
  MenuButton,
  MenuItem,
  Modal,
  ModalClose,
  ModalDialog,
  Sheet,
  Typography,
} from "@mui/joy";
import { useState } from "react";

import { isEmailVerified } from "app/(utils)";
import type { AuthenticatedUser } from "app/api";

interface Props {
  user?: AuthenticatedUser;
}

function AccountIcon({ user }: Props) {
  if (!user) {
    return (
      <Sheet
        variant="soft"
        sx={{
          px: 3,
          py: 0.5,
          ml: 2,
          borderRadius: 5,
          backgroundColor: theme => theme.vars.palette.primary[400],
        }}
      >
        <Link
          href={"/auth/signin"}
          style={{
            textDecoration: "none",
            color: "inherit",
            outline: 0,
            cursor: "pointer",
          }}
        >
          <Typography sx={{ color: "white" }}>Log In or Sign Up</Typography>
        </Link>
      </Sheet>
    );
  }

  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationModalLoading, setVerificationModalLoading] = useState(false);

  const onSendVerificationEmail = async () => {
    setVerificationModalLoading(true);

    const formData = new FormData();
    formData.set("email", user.email);

    await fetch("/api/account/verify/send", {
      method: "POST",
      body: formData,
    });

    setVerificationModalOpen(false);
    setVerificationModalLoading(false);
  };

  let avatar: React.ReactNode | undefined;
  if (user) {
    avatar = (
      <Avatar
        size="sm"
        src={user.image ? `${process.env.NEXT_PUBLIC_WEB_ROOT}/${user.image}` : undefined}
      />
    );

    // Unverified badge takes precedent over notification badge
    if (!isEmailVerified(user)) {
      avatar = (
        <Badge badgeContent="❕" color="danger" size="sm">
          {avatar}
        </Badge>
      );
    } else {
      const unreadNotifications = user.notifications.filter(n => !n.read).length;
      if (unreadNotifications > 0) {
        avatar = (
          <Badge badgeContent={unreadNotifications} color="secondary">
            {avatar}
          </Badge>
        );
      }
    }
  }

  return (
    <>
      <Box sx={{ ml: 1 }}>
        <Dropdown>
          <MenuButton
            slots={{ root: IconButton }}
            slotProps={{ root: { style: { backgroundColor: "#00000000" } } }}
            sx={{ backgroundColor: "#00000000" }}
          >
            {avatar}
          </MenuButton>
          <Menu placement="bottom">
            <MenuItem>
              <ListItemDecorator>
                <AccountCircle />
              </ListItemDecorator>
              <Link
                href={`/users/${user.name}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  outline: 0,
                  cursor: "pointer",
                }}
              >
                Account
              </Link>
            </MenuItem>
            {!isEmailVerified(user) && (
              <MenuItem onClick={() => setVerificationModalOpen(true)}>
                <ListItemDecorator>
                  <PriorityHigh color="error" />
                </ListItemDecorator>
                Email Not Verified
              </MenuItem>
            )}
            <Divider />
            <MenuItem>
              <ListItemDecorator>
                <Logout />
              </ListItemDecorator>
              <Link
                href="/auth/signout"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  outline: 0,
                  cursor: "pointer",
                }}
              >
                Logout
              </Link>
            </MenuItem>
          </Menu>
        </Dropdown>
      </Box>

      <Modal open={verificationModalOpen} onClose={() => setVerificationModalOpen(false)}>
        <ModalDialog>
          <ModalClose variant="plain" sx={{ m: 1 }} />
          <Typography id="modal-title" level="title-lg">
            Send verification email?
          </Typography>
          <Typography level="body-lg">
            You will not be able to create modules or releases until your email account is verified
          </Typography>
          <Box
            sx={{
              mt: 1,
              display: "flex",
              gap: 1,
              flexDirection: { xs: "column", sm: "row-reverse" },
            }}
          >
            <Button
              variant="solid"
              color="primary"
              loading={verificationModalLoading}
              onClick={onSendVerificationEmail}
            >
              Send
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setVerificationModalOpen(false)}
            >
              Cancel
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </>
  );
}

export default function AppBarIcons({ user }: Props) {
  return (
    <>
      {user && isEmailVerified(user) && (
        <Link
          href="/apply"
          style={{
            textDecoration: "none",
            color: "inherit",
            outline: 0,
            cursor: "pointer",
          }}
        >
          <IconButton sx={{ mr: 1 }}>
            <AddBox />
          </IconButton>
        </Link>
      )}
      <AccountIcon user={user} />
    </>
  );
}
