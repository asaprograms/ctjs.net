"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import type { PalettePrimary, PaletteRange } from "@mui/joy";
import { CssVarsProvider as JoyCssVarsProvider } from "@mui/joy";
import { extendTheme } from "@mui/joy";
import type { BreakpointsOptions } from "@mui/material/styles";
import {
  THEME_ID as MATERIAL_THEME_ID,
  Experimental_CssVarsProvider as MaterialCssVarsProvider,
  experimental_extendTheme as materialExtendTheme,
} from "@mui/material/styles";
import { useServerInsertedHTML } from "next/navigation";
import { useState } from "react";

declare module "@mui/material/styles" {
  interface BreakpointOverrides {
    mobile: true;
    tablet: true;
    desktop: true;
  }
}

declare module "@mui/joy/styles" {
  interface BreakpointOverrides {
    mobile: true;
    tablet: true;
    desktop: true;
  }

  interface ColorPalettePropOverrides {
    secondary: true;
  }

  interface Palette {
    secondary: PaletteRange;
  }
}

const breakpoints: BreakpointsOptions = {
  values: {
    // Default values (TODO: Remove?)
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,

    // Named
    mobile: 0,
    tablet: 640,
    desktop: 1000,
  },
};

const primary: Partial<PalettePrimary> = {
  "50": "#fff",
  "100": "#260058",
  "200": "#3f0f81",
  "300": "#572e99",
  "400": "#6f48b2",
  "500": "#8962cd",
  "600": "#a37cea",
  "700": "#be99ff",
  "800": "#d4bbff",
  "900": "#ebdcff",
};

const secondary: Partial<PalettePrimary> = {
  "50": "#fff",
  "100": "#001d30",
  "200": "#003450",
  "300": "#004b71",
  "400": "#006495",
  "500": "#007eba",
  "600": "#0099e0",
  "700": "#3cb4fe",
  "800": "#8fcdff",
  "900": "#cbe6ff",
};

// const tertiary: PaletteColorOptions = {
//   "50": "#fff",
//   "100": "#",
//   "200": "#",
//   "300": "#",
//   "400": "#",
//   "500": "#",
//   "600": "#",
//   "700": "#",
//   "800": "#",
//   "900": "#",
// };

export const joyTheme = extendTheme({
  colorSchemes: {
    dark: {
      palette: {
        primary,
        secondary,
        background: {
          body: "var(--joy-palette-neutral-900)",
        },
      },
    },
  },
  components: {
    JoyTabList: {
      styleOverrides: {
        root: {
          // For some reason this is 1 by default, which puts it over the VSCode editor
          zIndex: 0,
        },
      },
    },
  },
  breakpoints,
});

export const materialTheme = materialExtendTheme({
  breakpoints,
});

interface Props {
  children: React.ReactNode;
}

export default function ThemeRegistry({ children }: Props) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "mui" });
    cache.compat = true;
    const prevInsert = cache.insert;
    let inserted: string[] = [];
    cache.insert = (...args) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };
    const flush = () => {
      const prevInserted = inserted;
      inserted = [];
      return prevInserted;
    };
    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) {
      return null;
    }
    let styles = "";
    for (const name of names) {
      styles += cache.inserted[name];
    }
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(" ")}`}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: FIXME: Try to find where I got this code snippet from and replace it if possible
        dangerouslySetInnerHTML={{
          __html: styles,
        }}
      />
    );
  });

  return (
    <CacheProvider value={cache}>
      <MaterialCssVarsProvider defaultMode="dark" theme={{ [MATERIAL_THEME_ID]: materialTheme }}>
        <JoyCssVarsProvider defaultMode="dark" theme={joyTheme}>
          {children}
        </JoyCssVarsProvider>
      </MaterialCssVarsProvider>
    </CacheProvider>
  );
}
