"use client";

import { Close, CloudUpload } from "@mui/icons-material";
import {
  Autocomplete,
  Badge,
  Box,
  Button,
  Chip,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Sheet,
  Stack,
  Switch,
  Typography,
} from "@mui/joy";
import colors from "@mui/joy/colors";
import type { PublicModule } from "app/api";
import { isModuleValid } from "app/constants";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import MarkdownEditor from "./MarkdownEditor";

interface ImageProps {
  url?: string;
  onUpload(file?: File): void;
}

// TODO: Drag and drop
function ImageUploader({ url, onUpload }: ImageProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleClick = () => inputRef.current?.click();

  const handleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    e.preventDefault();
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const inputElement = (
    <input
      type="file"
      id="file"
      ref={inputRef}
      onChange={handleChangeFile}
      style={{ display: "none" }}
    />
  );

  if (!url) {
    return (
      <Stack
        sx={{
          width: 300,
          height: 200,
          flexShrink: 0,
          ml: 8,
          outline: theme => `dashed ${theme.vars.palette.neutral[600]}`,
          borderRadius: 10,
          cursor: "pointer",
          ":hover": {
            outline: theme => `dashed ${theme.vars.palette.neutral[400]}`,
            backgroundColor: theme => theme.vars.palette.neutral[700],
          },
        }}
        justifyContent="center"
        alignItems="center"
        onClick={handleClick}
      >
        <CloudUpload sx={{ fontSize: 84 }} />
        <Typography>Image</Typography>
        {/* <Typography>Drag files to Upload</Typography> */}
        {inputElement}
      </Stack>
    );
  }

  return (
    <Badge
      color="danger"
      badgeContent={<Close />}
      sx={{ cursor: "pointer" }}
      onClick={() => onUpload()}
    >
      <Stack
        sx={{
          width: 300,
          height: 200,
          flexShrink: 0,
          ml: 8,
          cursor: "pointer",
          outline: theme => `solid ${theme.vars.palette.neutral[700]}`,
          borderRadius: 10,
          ":hover": {
            outline: theme => `dashed ${theme.vars.palette.neutral[400]}`,
            backgroundColor: theme => theme.vars.palette.neutral[700],
          },
        }}
        justifyContent="center"
        alignItems="center"
        onClick={handleClick}
      >
        <img
          src={url}
          alt="module icon"
          width="100%"
          height="100%"
          style={{ objectFit: "contain" }}
        />
        {inputElement}
      </Stack>
    </Badge>
  );
}

interface Props {
  editingModule?: PublicModule;
  availableTags: string[];
  onSubmit(data: FormData): Promise<string | undefined>;
}

export default function ModuleForm({ editingModule, availableTags, onSubmit }: Props) {
  const [name, setName] = useState(editingModule?.name ?? "");
  const [summary, setSummary] = useState(editingModule?.summary ?? "");
  const [description, setDescription] = useState(editingModule?.description ?? undefined);
  const [hidden, setHidden] = useState(editingModule?.hidden ?? false);
  const [tags, setTags] = useState<string[]>(editingModule?.tags ?? []);
  const [error, setError] = useState<string | undefined>();
  const [createLoading, setCreateLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState(editingModule?.image ?? undefined);

  const setUploadedImage = (file?: File) => {
    if (!file) return;
    file.arrayBuffer().then(buf => {
      setImageUrl(`data:image/png;base64,${Buffer.from(buf).toString("base64")}`);
    });
  };

  const router = useRouter();

  const handleSubmit = async () => {
    setError(undefined);
    setCreateLoading(true);

    const form = new FormData();
    form.set("name", name);
    if (summary) form.set("summary", summary);
    if (description) form.set("description", description);
    if (imageUrl) form.set("image", imageUrl);
    if (tags) form.set("tags", tags.join(","));
    form.set("hidden", hidden.toString());

    const errorMessage = await onSubmit(form);
    setCreateLoading(false);

    if (!errorMessage) {
      router.push(`/modules/${name}`);
      router.refresh();
      return;
    }

    setError(errorMessage);
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
          <Typography level="h3">
            {editingModule ? `Editing Module ${editingModule.name}` : "Create a Module"}
          </Typography>
        </Box>
        <Stack direction="row" justifyContent="space-between">
          <Stack spacing={3} width="100%">
            {!editingModule && (
              <FormControl>
                <FormLabel>Module Name</FormLabel>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  error={!isModuleValid(name)}
                  fullWidth
                />
                <FormHelperText>
                  Must be 3-64 character long and can only have letters, numbers, and underscores
                </FormHelperText>
              </FormControl>
            )}
            <Stack direction="row" spacing={3}>
              <FormControl sx={{ flexGrow: 1 }}>
                <FormLabel>Tags</FormLabel>
                <Autocomplete
                  multiple
                  autoHighlight
                  options={availableTags}
                  value={tags}
                  onChange={(_, value) => setTags(value)}
                  getOptionDisabled={() => tags.length >= 4}
                  renderTags={(tags, getTagProps) =>
                    tags.map((item, index) => (
                      // Note: getTagProps() returns an object with the key prop, but eslint can't
                      //       see that for some reason
                      // eslint-disable-next-line react/jsx-key
                      // biome-ignore lint/correctness/useJsxKeyInIterable: getTagProps() includes a key prop; adding key={} produces a TS error
                      <Chip
                        variant="solid"
                        color="primary"
                        endDecorator={<Close fontSize="small" />}
                        {...getTagProps({ index })}
                      >
                        {item}
                      </Chip>
                    ))
                  }
                />
                <FormHelperText>Choose up to 4 tags</FormHelperText>
              </FormControl>
              <FormControl>
                <FormLabel>Hidden</FormLabel>
                <Switch
                  checked={hidden}
                  onChange={e => setHidden(e.target.checked)}
                  variant={hidden ? "solid" : "outlined"}
                />
              </FormControl>
            </Stack>
          </Stack>
          <ImageUploader url={imageUrl} onUpload={setUploadedImage} />
        </Stack>
        <FormControl sx={{ mt: 3 }}>
          <FormLabel>Summary</FormLabel>
          <Input value={summary} onChange={e => setSummary(e.target.value)} fullWidth />
          <FormHelperText>
            Displayed on the module preview card. Limited to 300 characters
          </FormHelperText>
        </FormControl>
        <Box mt={3}>
          <FormLabel sx={{ mb: 1 }}>Description</FormLabel>
          <MarkdownEditor value={description} setValue={setDescription} />
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
            disabled={!isModuleValid(name)}
            sx={{
              width: 150,
              color: colors.grey[100],
              backgroundColor: colors.green[700],
            }}
            loading={createLoading}
          >
            Submit
          </Button>
        </Stack>
      </Sheet>
    </Box>
  );
}
