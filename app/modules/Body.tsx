import {
  Code,
  DeleteForever,
  Download,
  EventNote,
  ExpandMore,
  PendingOutlined,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionGroup,
  AccordionSummary,
  Box,
  Button,
  Chip,
  DialogActions,
  DialogTitle,
  Divider,
  Modal,
  ModalDialog,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/joy";
import type { PublicModule, PublicRelease } from "app/api";
import Markdown from "marked-react";
import type { MouseEvent, MouseEventHandler } from "react";
import { useState } from "react";

import CustomEditor, { filesFromZip } from "./CustomEditor";

interface ReleaseCardProps {
  module: PublicModule;
  release: PublicRelease;
  ownerView: boolean;
  onBrowseCode(releaseId: string): Promise<void>;
}

function ReleaseCard({ module, release, ownerView, onBrowseCode }: ReleaseCardProps) {
  const [editorLoading, setEditorLoading] = useState(false);
  const [deleteModalShowing, setDeleteModalShowing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const browseCode: MouseEventHandler = event => {
    event.stopPropagation();
    setEditorLoading(true);
    onBrowseCode(release.id).then(() => setEditorLoading(false));
  };

  const deleteRelease = () => {
    setDeleteLoading(true);

    // TODO: Check response
    fetch(`/api/modules/${module.name}/releases/${release.id}`, {
      method: "DELETE",
    });

    setDeleteLoading(false);
    setDeleteModalShowing(false);
  };

  return (
    <Accordion sx={{ my: 1 }}>
      <AccordionSummary indicator={release.changelog ? <ExpandMore /> : null}>
        <Stack
          display="flex"
          flexDirection="row"
          alignContent="center"
          alignItems="center"
          height="100%"
          width="100%"
        >
          {!release.verified && (
            <Tooltip
              title="A CT creator will verify your release soon; please be patient!"
              placement="top"
            >
              <Chip
                sx={theme => ({
                  mr: 2,
                  backgroundColor: theme.vars.palette.warning[500],
                })}
              >
                Pending
              </Chip>
            </Tooltip>
          )}
          <Stack width={170} flexDirection="row">
            <Typography level="title-lg" mr={1}>
              v{release.release_version}
            </Typography>
            <Typography>for ct {release.mod_version}</Typography>
          </Stack>
          <Box width={100} display={{ mobile: "none", tablet: "flex" }} flexDirection="row" mr={2}>
            <Download />
            <Typography ml={1}>{release.downloads.toLocaleString()}</Typography>
          </Box>
          <Box width={180} display={{ mobile: "none", tablet: "flex" }} flexDirection="row">
            <EventNote />
            <Typography ml={1} level="body-sm">
              Created: {new Date(release.created_at).toLocaleDateString()}
            </Typography>
          </Box>
          <Button
            component="div" /* AccordionSummary uses a <button> */
            size="sm"
            sx={{
              backgroundColor: theme => theme.vars.palette.neutral[700],
            }}
            onClick={browseCode}
            startDecorator={editorLoading ? <PendingOutlined /> : <Code />}
          >
            View Code
          </Button>
          {ownerView && (
            <Button
              component="div" /* AccordionSummary uses a <button> */
              size="sm"
              color="danger"
              variant="outlined"
              onClick={(e: MouseEvent<HTMLDivElement>) => {
                e.stopPropagation();
                setDeleteModalShowing(true);
              }}
              endDecorator={<DeleteForever />}
              sx={{ ml: 2 }}
            >
              Delete
            </Button>
          )}
        </Stack>
      </AccordionSummary>
      {release.changelog && (
        <AccordionDetails>
          <Divider />
          <Markdown>{release.changelog}</Markdown>
        </AccordionDetails>
      )}
      <Modal open={deleteModalShowing} onClose={() => setDeleteModalShowing(false)}>
        <ModalDialog role="alertdialog">
          <DialogTitle>
            Are you sure you want to delete release v{release.release_version}
          </DialogTitle>
          <DialogActions>
            <Button variant="solid" color="danger" onClick={deleteRelease} loading={deleteLoading}>
              Yes, delete the release
            </Button>
            <Button variant="plain" color="neutral" onClick={() => setDeleteModalShowing(false)}>
              No, take me back
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </Accordion>
  );
}

interface BodyProps {
  ownerView: boolean;
  module: PublicModule;
}

export default function Body({ ownerView, module }: BodyProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [files, setFiles] = useState<Record<string, string>>({});

  async function onBrowseCode(releaseId: string): Promise<void> {
    const res = await fetch(`/api/modules/${module.name}/releases/${releaseId}/scripts`);

    // TODO: Show error
    if (!res.ok) return;

    setFiles(await filesFromZip(module.name, new Uint8Array(await res.arrayBuffer())));
    setEditorOpen(true);
  }

  return (
    <>
      <Tabs variant="soft" sx={{ marginTop: 3 }}>
        <TabList>
          <Tab>Description</Tab>
          {module.releases.length > 0 && <Tab>{module.releases.length} Releases</Tab>}
        </TabList>
        <TabPanel value={0}>
          {module.description && <Markdown>{module.description}</Markdown>}
        </TabPanel>
        {module.releases.length > 0 && (
          <TabPanel value={1}>
            <AccordionGroup variant="plain" transition="0.2s ease">
              {module.releases
                .toSorted((a, b) => b.release_version.localeCompare(a.release_version))
                .map(release => (
                  <ReleaseCard
                    key={release.id}
                    module={module}
                    release={release}
                    ownerView={ownerView}
                    onBrowseCode={onBrowseCode}
                  />
                ))}
            </AccordionGroup>
          </TabPanel>
        )}
      </Tabs>
      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        sx={{ width: "100%", height: "100%" }}
      >
        <Box
          display="flex"
          alignContent="center"
          alignItems="center"
          justifyContent="center"
          justifyItems="center"
          width={{ mobile: "95%", desktop: "80%" }}
          height={{ mobile: "95%", desktop: "80%" }}
          overflow="hidden"
          sx={{
            position: "absolute" as const,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            borderRadius: 10,
          }}
        >
          <CustomEditor projectName={module.name} files={files} />
        </Box>
      </Modal>
    </>
  );
}
