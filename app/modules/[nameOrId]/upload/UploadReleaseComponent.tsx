"use client";

import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  Input,
  Sheet,
  Stack,
  SvgIcon,
  Typography,
  styled,
} from "@mui/joy";
import colors from "@mui/joy/colors";
import type { PublicModule } from "app/api";
import Version from "app/api/(utils)/Version";
import { useRouter } from "next/navigation";
import { useState } from "react";

import MarkdownEditor from "../../MarkdownEditor";

interface FileUploadProps {
  file?: File;
  onUpload(file: File): void;
}

// Taken from https://mui.com/joy-ui/react-button/#file-upload
const VisuallyHiddenInput = styled("input")`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

// Taken from https://mui.com/joy-ui/react-button/#file-upload
function InputFileUpload({ file, onUpload }: FileUploadProps) {
  const handleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <Stack direction="row">
      <Button
        component="label"
        tabIndex={-1}
        variant="outlined"
        color="neutral"
        startDecorator={
          <SvgIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <title>Upload icon</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
              />
            </svg>
          </SvgIcon>
        }
      >
        Upload a file
        <VisuallyHiddenInput type="file" onChange={handleChangeFile} accept=".zip" />
      </Button>
      {file && <Typography ml={3}>{file.name}</Typography>}
    </Stack>
  );
}

interface Props {
  module: PublicModule;
  validModVersions: Record<string, string[]>;
}

export default function UploadReleaseComponent({ module, validModVersions }: Props) {
  const [error, setError] = useState<string | undefined>();
  const [changelog, setChangelog] = useState<string | undefined>();
  const [releaseVersion, setReleaseVersion] = useState<string | undefined>();
  const [modVersion, setModVersion] = useState<string | null>(null);
  const [gameVersions, setGameVersions] = useState<string[]>([]);
  const [zip, setZip] = useState<File | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const releaseVersionError =
    releaseVersion && Version.isValid(releaseVersion)
      ? module.releases.some(r => r.release_version === releaseVersion)
        ? "Release version already exists"
        : undefined
      : "Invalid version";

  const canSubmit = !releaseVersionError && !!modVersion && gameVersions.length > 0 && !!zip;

  const handleSubmit = async () => {
    setLoading(true);
    setError(undefined);

    if (!releaseVersion || !modVersion || !zip) throw new Error("unreachable");

    const data = new FormData();
    data.set("releaseVersion", releaseVersion);
    data.set("modVersion", modVersion);
    data.set("gameVersions", gameVersions.join(","));
    if (changelog) data.set("changelog", changelog);
    data.set("module", zip);

    const response = await fetch(`/api/modules/${module.name}/releases`, {
      method: "PUT",
      body: data,
    });

    setLoading(false);

    if (response.ok) {
      router.back();
      router.refresh();
      return;
    }

    const body = (await response.body?.getReader().read())?.value;
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
      justifyContent="center"
      justifyItems="center"
      alignItems="center"
      alignContent="center"
    >
      {error && (
        <Sheet variant="solid" color="danger" sx={{ mb: 5, px: 5, py: 1, borderRadius: 10 }}>
          <Typography>{error}</Typography>
        </Sheet>
      )}

      <Sheet variant="soft" sx={{ width: "100%", maxWidth: 1000, borderRadius: 10, p: 3 }}>
        <Box mb={2} width="100%" display="flex" justifyContent="center">
          <Typography level="h3">Create a release for {module.name}</Typography>
        </Box>
        <Grid container spacing={5}>
          <Grid xs={12} md={4}>
            <FormControl>
              <FormLabel>Release Version</FormLabel>
              <Input
                value={releaseVersion}
                type="text"
                onChange={e => setReleaseVersion(e.target.value)}
                fullWidth
                error={!!releaseVersionError}
              />
              {releaseVersionError && <FormHelperText>{releaseVersionError}</FormHelperText>}
            </FormControl>
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <FormControl>
              <FormLabel>Mod Version</FormLabel>
              <Autocomplete
                autoHighlight
                value={modVersion}
                onChange={(_, value) => {
                  setModVersion(value);
                  setGameVersions([]);
                }}
                options={Object.keys(validModVersions).toSorted().toReversed()}
                error={!modVersion}
              />
              <FormHelperText>
                The oldest possible CT version that this release works on
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <FormControl>
              <FormLabel>MC Versions</FormLabel>
              <Autocomplete
                autoHighlight
                multiple
                value={gameVersions}
                onChange={(_, value) => {
                  setGameVersions(value);
                }}
                options={modVersion ? validModVersions[modVersion].toSorted().toReversed() : []}
                error={gameVersions.length === 0}
              />
              <FormHelperText>All Minecraft versions that this release works on</FormHelperText>
            </FormControl>
          </Grid>
        </Grid>
        <FormControl>
          <FormLabel>Scripts</FormLabel>
          <Box>
            <InputFileUpload file={zip} onUpload={setZip} />
          </Box>
          <FormHelperText>
            This should be a .zip file that contains the metadata.json file and other .js files
          </FormHelperText>
        </FormControl>
        <Box mt={3}>
          <FormLabel sx={{ mb: 1 }}>Changelog</FormLabel>
          <MarkdownEditor value={changelog} setValue={setChangelog} />
        </Box>
        <Stack direction="row" justifyContent="end" mt={2} spacing={4}>
          <Button
            onClick={() => router.back()}
            sx={{
              width: 150,
              color: colors.grey[100],
              backgroundColor: colors.red[700],
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
            sx={{
              width: 150,
              color: colors.grey[100],
              backgroundColor: colors.green[700],
            }}
          >
            Submit
          </Button>
        </Stack>
      </Sheet>
    </Box>
  );
}
