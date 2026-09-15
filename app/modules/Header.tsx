import { Delete, Edit, EventNote, EventRepeat, Lock, Upload } from "@mui/icons-material";
import Download from "@mui/icons-material/Download";
import {
  Box,
  Button,
  DialogActions,
  DialogTitle,
  IconButton,
  Modal,
  ModalDialog,
  Sheet,
  Stack,
  Tooltip,
  Typography,
} from "@mui/joy";
import { green, red, yellow } from "@mui/material/colors";
import { Mobile, NotMobile } from "app/Mobile";
import type { PublicModule } from "app/api";
import Markdown from "marked-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  module: PublicModule;
  ownerView: boolean;
  hideUser?: boolean;
}

export default function Header({ module, ownerView, hideUser }: HeaderProps) {
  const [deleteModalShowing, setDeleteModalShowing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const totalDownloads = module.releases.reduce((sum, r) => sum + r.downloads, 0);
  const router = useRouter();

  const deleteModule = () => {
    setDeleteLoading(true);

    // TODO: Check response
    fetch(`/api/modules/${module.name}`, {
      method: "DELETE",
    });

    setDeleteLoading(false);
    setDeleteModalShowing(false);
    router.push("/modules");
  };

  return (
    <>
      {ownerView && (
        <Box mx={2} mb={2} width="100%" display="flex" justifyContent="center">
          <Mobile>
            <Stack direction="row" spacing={2}>
              <IconButton
                sx={{
                  px: 3,
                  borderWidth: 1,
                  borderColor: yellow[900],
                  color: yellow[900],
                }}
                variant="outlined"
                onClick={() => router.push(`/modules/${module.name}/edit`)}
              >
                <Edit />
              </IconButton>
              <IconButton
                sx={{
                  px: 3,
                  borderWidth: 1,
                  borderColor: green[600],
                  color: green[600],
                }}
                variant="outlined"
                onClick={() => router.push(`/modules/${module.name}/upload`)}
              >
                <Upload />
              </IconButton>
              <IconButton
                sx={{
                  px: 3,
                  borderWidth: 1,
                  borderColor: red[600],
                  color: red[600],
                }}
                variant="outlined"
              >
                <Delete />
              </IconButton>
            </Stack>
          </Mobile>
          <NotMobile>
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                color="warning"
                startDecorator={<Edit />}
                onClick={() => router.push(`/modules/${module.name}/edit`)}
              >
                Edit Module
              </Button>
              <Button
                variant="outlined"
                color="success"
                startDecorator={<Upload />}
                onClick={() => router.push(`/modules/${module.name}/upload`)}
              >
                Upload Release
              </Button>
              <Button
                variant="outlined"
                color="danger"
                startDecorator={<Delete />}
                onClick={() => setDeleteModalShowing(true)}
              >
                Delete Module
              </Button>
            </Stack>
          </NotMobile>
        </Box>
      )}
      <Sheet variant="soft" sx={{ padding: 2, borderRadius: 4 }}>
        <Stack direction={{ mobile: "column", tablet: "row" }} justifyContent="space-between">
          <Stack spacing={2} ml={1}>
            <Stack direction="row" alignItems="center" justifyContent="start" spacing={2}>
              {module.hidden && (
                <Tooltip title={<Typography>This module is hidden</Typography>}>
                  <Box display="flex" alignItems="center" ml={1}>
                    <Lock />
                  </Box>
                </Tooltip>
              )}
              <Typography
                fontSize={{ mobile: 12, tablet: 24 }}
                sx={{
                  color: theme => theme.vars.palette.neutral[100],
                }}
                noWrap
              >
                {module.name}
              </Typography>
              {hideUser ? null : (
                <Typography level="body-sm" noWrap>
                  by {module.owner.name}
                </Typography>
              )}
            </Stack>
            {module.summary && <Markdown>{module.summary}</Markdown>}
            {module.tags && (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="start"
                spacing={2}
                overflow="hidden"
              >
                {module.tags.slice(0, 5).map(tag => (
                  <Typography key={tag} level="body-md">
                    #{tag}
                  </Typography>
                ))}
              </Stack>
            )}
          </Stack>
          <Stack direction="row">
            {module.image && (
              <Box display={{ mobile: "none", tablet: "flex" }} alignItems="center" mx={3}>
                <img
                  src={module.image}
                  alt="module icon"
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
                title={new Date(module.created_at).toLocaleTimeString()}
                placement="top"
                arrow
              >
                <Box display="flex" flexDirection="row" alignContent="center" alignItems="center">
                  <EventNote fontSize="small" />
                  <Typography pl={1} suppressHydrationWarning level="body-sm" whiteSpace="nowrap">
                    Created: {new Date(module.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Tooltip>
              <Tooltip
                suppressHydrationWarning
                title={new Date(module.updated_at).toLocaleTimeString()}
                arrow
              >
                <Box display="flex" flexDirection="row" alignContent="center" alignItems="center">
                  <EventRepeat fontSize="small" />
                  <Typography pl={1} suppressHydrationWarning level="body-sm" whiteSpace="nowrap">
                    Updated: {new Date(module.updated_at).toLocaleDateString()}
                  </Typography>
                </Box>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
      </Sheet>
      <Modal open={deleteModalShowing} onClose={() => setDeleteModalShowing(false)}>
        <ModalDialog role="alertdialog">
          <DialogTitle>Are you sure you want to delete module {module.name}</DialogTitle>
          <DialogActions>
            <Button variant="solid" color="danger" onClick={deleteModule} loading={deleteLoading}>
              Yes, delete the module
            </Button>
            <Button variant="plain" color="neutral" onClick={() => setDeleteModalShowing(false)}>
              No, take me back
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </>
  );
}
