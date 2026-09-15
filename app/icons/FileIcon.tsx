import javascript from "./javascript.svg";
import json from "./json.svg";
import markdown from "./markdown.svg";
import text from "./text.svg";
import typescript from "./typescript.svg";

const EXT_TO_LANG_MAP: Record<string, string> = {
  tsx: "typescript",
  ts: "typescript",
  jsx: "javascript",
  js: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  md: "markdown",
};

// https://github.com/vscode-icons/vscode-icons/tree/master/icons
const LANG_TO_SVG_MAP: Record<string, typeof text> = {
  javascript,
  json,
  markdown,
  text,
  typescript,
};

export const getLanguage = (path: string) => {
  const lastDot = path.lastIndexOf(".");
  if (lastDot <= 0) return "text";
  return EXT_TO_LANG_MAP[path.substring(lastDot + 1)] ?? "text";
};

interface FileIconProps {
  path: string;
}

export default function FileIcon({ path }: FileIconProps) {
  return <img height={14} src={LANG_TO_SVG_MAP[getLanguage(path)].src} alt="filetype icon" />;
}
