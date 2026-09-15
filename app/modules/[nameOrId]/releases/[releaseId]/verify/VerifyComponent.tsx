"use client";

import { Box, Grid, Sheet, Stack, Typography } from "@mui/joy";
import type { PublicModule, PublicRelease } from "app/api";
import CustomEditor, { filesFromZip } from "app/modules/CustomEditor";
import Markdown from "marked-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Props {
  module: PublicModule;
  release: PublicRelease;
  oldRelease?: PublicRelease;
}

export default function VerifyComponent({ module, release, oldRelease }: Props) {
  const [files, setFiles] = useState<Record<string, string> | undefined>();
  const [oldFiles, setOldFiles] = useState<Record<string, string> | undefined>();

  useEffect(() => {
    const fetchFiles = async () => {
      const [files, oldFiles] = await Promise.all([
        fetch(`/api/modules/${module.name}/releases/${release.id}/scripts`),
        oldRelease && fetch(`/api/modules/${module.name}/releases/${oldRelease.id}/scripts`),
      ])
        .then(([newScripts, oldScripts]) =>
          Promise.all([newScripts.arrayBuffer(), oldScripts?.arrayBuffer()]),
        )
        .then(([newScriptsBuffer, oldScriptsBuffer]) =>
          Promise.all([
            filesFromZip(module.name, newScriptsBuffer),
            oldScriptsBuffer && filesFromZip(module.name, oldScriptsBuffer),
          ]),
        );

      return { files, oldFiles };
    };

    fetchFiles().then(({ files, oldFiles }) => {
      setFiles(files);
      setOldFiles(oldFiles);
    });
  }, [module, oldRelease, release]);

  return (
    <Stack>
      <Sheet variant="soft" sx={{ mt: 4, padding: 2, borderRadius: 4 }}>
        <Stack spacing={2} alignItems="center" width="100%">
          <Box width="100%" display="flex" justifyContent="center" mb={2}>
            <Typography level="h3" sx={{ textAlign: "center" }}>
              Verify release v{release.release_version} for module{" "}
              <Link href={`/modules/${module.name}`} target="_blank">
                {module.name}
              </Link>
            </Typography>
          </Box>
          <Grid container spacing={2} sx={{ width: { mobile: "100%", tablet: "70% " } }}>
            <Grid mobile={12} tablet={4}>
              <Typography sx={{ textAlign: "center" }}>
                CT version: {release.mod_version}
              </Typography>
            </Grid>
            {/* TODO: Create a map of CT versions -> game versions to make it easier for people */}
            {/* <Grid mobile={12} tablet={4}>
              <Typography sx={{ textAlign: "center" }}>
                MC version{release.game_versions.length > 1 ? "s" : ""}:{" "}
                {release.game_versions.join(", ")}
              </Typography>
            </Grid> */}
            <Grid mobile={12} tablet={4}>
              <Typography sx={{ textAlign: "center" }}>
                Created: {new Date(release.created_at).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>
          {release.changelog && (
            <Stack width="100%" display="flex" alignItems="center">
              <Typography sx={{ mb: 2 }}>Changelog:</Typography>
              <Sheet
                sx={{
                  borderRadius: 4,
                  px: 2,
                  backgroundColor: theme => theme.vars.palette.neutral[700],
                }}
              >
                <Markdown>{release.changelog}</Markdown>
              </Sheet>
            </Stack>
          )}
        </Stack>
      </Sheet>
      <Box
        display="flex"
        justifyContent="center"
        justifyItems="center"
        width={{ mobile: "95vw", desktop: "95vw" }}
        height="90vh"
        overflow="hidden"
        position="relative"
        left="50%"
        borderRadius={10}
        mt={3}
        sx={{ transform: "translate(-50%, 0)" }}
      >
        {files ? (
          <CustomEditor projectName={module.name} files={files} oldFiles={oldFiles} />
        ) : (
          <Typography>Loading scripts...</Typography>
        )}
      </Box>
    </Stack>
  );
}
