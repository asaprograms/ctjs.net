"use client";

import { Download, OpenInNew } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardOverflow,
  Divider,
  Typography,
} from "@mui/joy";

export interface GitInfo {
  version: string;
  releaseUrl: string;
  jarUrl: string;
  createdAt: string;
  title: string;
}

interface DownloadComponentProps {
  git: GitInfo;
}

export function DownloadComponent({ git }: DownloadComponentProps) {
  return (
    <Box sx={{ width: "100%" }}>
      <Typography level="title-lg" sx={{ textAlign: "center", mb: 2 }}>
        {git.title}
      </Typography>
      <Card variant="outlined" sx={{ width: 320, maxWidth: "100%", boxShadow: "lg" }}>
        <CardContent>
          <Typography>Version: {git.version}</Typography>
          <Typography>Published: {new Date(git.createdAt).toLocaleDateString()}</Typography>
        </CardContent>
        <CardOverflow variant="soft" sx={{ bgcolor: "background.level1" }}>
          <Divider inset="context" />
          <CardActions>
            <Button
              startDecorator={<OpenInNew />}
              variant="plain"
              color="neutral"
              href={git.releaseUrl}
              component="a"
              target="_blank"
            >
              <Typography
                sx={theme => ({
                  color: theme.vars.palette.secondary.mainChannel,
                })}
              >
                Changelog
              </Typography>
            </Button>
            <Button
              variant="solid"
              color="primary"
              startDecorator={<Download />}
              href={git.jarUrl}
              component="a"
            >
              Download
            </Button>
          </CardActions>
        </CardOverflow>
      </Card>
    </Box>
  );
}
