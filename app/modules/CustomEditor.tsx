import Editor, { DiffEditor } from "@monaco-editor/react";
import { ChevronRight, Close } from "@mui/icons-material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Box, IconButton, Typography, styled } from "@mui/joy";
import type { TreeItemProps } from "@mui/x-tree-view/TreeItem";
import { TreeItem, treeItemClasses } from "@mui/x-tree-view/TreeItem";
import { TreeView } from "@mui/x-tree-view/TreeView";
import { useBreakpoint } from "app/(utils)/layout";
import FileIcon, { getLanguage } from "app/icons/FileIcon";
import JSZip from "jszip";
import { useState } from "react";
import * as React from "react";

enum Colors {
  TAB_SELECTED = "#1E1E1E",
  TAB_UNSELECTED = "#2D2D2D",
  PATH_BAR = TAB_SELECTED,
  TEXT = "#cccccccc",
  EXPLORER = "#252526",
  FILE_HOVER = "#2A2D2E",
  FILE_SELECTED = "#37373D",
  FILE_FOCUSED = "#04395E",
  FILE_FOCUSED_BORDER = "#007FD4",
  EDITOR_BACKGROUND = TAB_SELECTED,
  BUTTON_HIGHLIGHT = "#383B41",

  ADDED_COLOR = "#43bf65",
  MODIFIED_COLOR = "#c9ae34",
  REMOVED_COLOR = "#db4f4f",
}

type FileSet = Record<string, string>;
type File = { oldContent?: string; newContent?: string; color?: string };
type FileTree = Record<string, File>;

function makeFileTree(newFileSet: FileSet, oldFileSet?: FileSet): FileTree {
  const fileTree: FileTree = {};

  const oldFiles = new Set(oldFileSet && Object.keys(oldFileSet));
  for (const [fileName, fileContent] of Object.entries(newFileSet)) {
    const file: File = { newContent: fileContent };
    const oldFileContent = oldFileSet?.[fileName];
    if (oldFileContent) {
      oldFiles.delete(fileName);
      file.oldContent = oldFileContent;
      if (fileContent && fileContent !== oldFileContent) file.color = Colors.MODIFIED_COLOR;
    } else {
      file.color = Colors.ADDED_COLOR;
    }
    fileTree[fileName] = file;
  }

  for (const fileName of oldFiles) {
    fileTree[fileName] = {
      oldContent: oldFileSet?.[fileName],
      color: Colors.REMOVED_COLOR,
    };
  }

  return fileTree;
}

interface TabListProps {
  files: FileTree;
  selectedFile?: string;
  onSwitchTab(path: string): void;
  onCloseTab(path: string): void;
}

const typoProps = {
  textColor: Colors.TEXT,
  level: "body-sm",
  fontSize: 13,
  fontFamily: "Segoe UI",
  alignSelf: "center",
} as const;

function TabList({ files, selectedFile, onSwitchTab, onCloseTab }: TabListProps) {
  if (selectedFile) {
    const parts = selectedFile.split("/");
    const partComponents = parts.map((part, idx) => (
      <React.Fragment key={part}>
        <Typography {...typoProps}>{part}</Typography>
        {idx !== parts.length - 1 && <ChevronRight />}
      </React.Fragment>
    ));

    return (
      <Box
        sx={{
          backgroundColor: Colors.TAB_UNSELECTED,
          "& > *": { userSelect: "none" },
        }}
      >
        <Box display="flex">
          {Object.entries(files).map(([path, file]) => {
            const lastSeparator = path.lastIndexOf("/");
            const name = lastSeparator === -1 ? path : path.substring(lastSeparator + 1);

            return (
              <Box
                key={path}
                display="flex"
                padding="5px"
                onClick={() => onSwitchTab(path)}
                onAuxClick={e => {
                  if (e.button === 1) onCloseTab(path);
                }}
                sx={{
                  backgroundColor:
                    selectedFile === path ? Colors.TAB_SELECTED : Colors.TAB_UNSELECTED,
                  borderRight: "1px solid #111111",
                  alignItems: "center",
                  alignContent: "center",
                  alignSelf: "center",
                  cursor: "pointer",
                }}
              >
                <FileIcon path={path} />
                <Typography {...typoProps} mx={1} sx={{ color: file.color }}>
                  {name}
                </Typography>
                <IconButton
                  onClick={e => {
                    e.stopPropagation();
                    onCloseTab(path);
                  }}
                  sx={{
                    p: 0,
                    "--IconButton-size": "10px",
                    ":hover": {
                      backgroundColor: Colors.BUTTON_HIGHLIGHT,
                    },
                  }}
                >
                  <Close
                    sx={{
                      fontSize: 16,
                      color: path === selectedFile ? Colors.TEXT : Colors.TAB_UNSELECTED,
                    }}
                  />
                </IconButton>
              </Box>
            );
          })}
        </Box>
        <Box
          display="flex"
          alignItems="center"
          sx={{
            backgroundColor: Colors.TAB_SELECTED,
            height: 20,
            pl: 1,
            pb: "4px",
          }}
        >
          {partComponents}
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: Colors.TAB_UNSELECTED,
        "& > *": { userSelect: "none" },
      }}
    />
  );
}

type StyledTreeItemProps = TreeItemProps & {
  labelIcon?: React.ReactNode;
  labelText: string;
  labelColor?: string;
};

const StyledTreeItemRoot = styled(TreeItem)({
  [`& .${treeItemClasses.content}`]: {
    position: "relative",
    left: "-300px",
    width: "calc(100% + 300px)",
    overflow: "hidden",
    margin: 1,
    "& > *": {
      position: "relative",
      left: "300px",
    },
    "&:hover": {
      backgroundColor: Colors.FILE_HOVER,
    },
    "&.Mui-focused, &.Mui-selected": {
      backgroundColor: Colors.FILE_SELECTED,
    },
    "&.Mui-selected.Mui-focused": {
      backgroundColor: Colors.FILE_FOCUSED,
      border: `1px solid ${Colors.FILE_FOCUSED_BORDER}`,
      margin: 0,
    },
    [`& .${treeItemClasses.label}`]: {
      paddingLeft: 0,
    },
  },
}) as unknown as typeof TreeItem;

const StyledTreeItem = React.forwardRef(function StyledTreeItem(
  props: StyledTreeItemProps,
  ref: React.Ref<HTMLLIElement>,
) {
  const { labelIcon, labelText, labelColor, ...other } = props;

  return (
    <StyledTreeItemRoot
      label={
        <Box display="flex">
          {labelIcon && (
            <Box position="absolute" left="-18px" top="1px">
              {labelIcon}
            </Box>
          )}
          <Typography {...typoProps} sx={{ fontWeight: "inherit", flexGrow: 1, color: labelColor }}>
            {labelText}
          </Typography>
        </Box>
      }
      {...other}
      ref={ref}
    />
  );
});

interface Node {
  id: number;
  name: string;
  fullPath?: string; // only non-null if this is a file, i.e., if children is null
  children?: Record<string, Node>;
}

interface TreeListProps {
  files: FileTree;
  onClickFile(path: string): void;
}

function TreeList({ files, onClickFile }: TreeListProps) {
  const paths = Object.keys(files);

  const root: Node = { id: 0, name: "__root" };
  let nextId = 1;

  for (const path of paths) {
    const parts = path.split("/");
    let node = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!node.children) node.children = {};

      if (!node.children[part]) {
        node.children[part] = { id: nextId++, name: part };
        if (i === parts.length - 1) node.children[part].fullPath = path;
      }
      node = node.children[part];
    }
  }

  const sortedChildren = (node: Node): Node[] | undefined => {
    if (!node.children) return;
    const children = Object.values(node.children);
    children.sort((a, b) => {
      if (a.children && !b.children) return -1;
      if (!a.children && b.children) return 1;
      return a.name.toLocaleLowerCase().localeCompare(b.name.toLocaleLowerCase());
    });
    return children;
  };

  const nodeToTreeList = (node: Node) => {
    const children = sortedChildren(node);

    return (
      <StyledTreeItem
        key={node.id}
        nodeId={node.id.toString()}
        labelText={node.name}
        labelIcon={!node.children && <FileIcon path={node.name} />}
        labelColor={node.fullPath && files[node.fullPath].color}
        sx={{ "& > *": { userSelect: "none" } }}
        onClick={() => (node.fullPath ? onClickFile(node.fullPath) : null)}
      >
        {children?.map(nodeToTreeList) ?? null}
      </StyledTreeItem>
    );
  };

  const nodes1 = sortedChildren(root)?.map(nodeToTreeList);

  return (
    <TreeView defaultCollapseIcon={<ExpandMoreIcon />} defaultExpandIcon={<ChevronRightIcon />}>
      {nodes1}
    </TreeView>
  );
}

export async function filesFromZip(
  moduleName: string,
  bytes: ArrayBuffer,
): Promise<Record<string, string>> {
  const zip = new JSZip();
  await zip.loadAsync(bytes);

  const files: Record<string, string> = {};
  const promises: Promise<void>[] = [];

  zip.forEach(async (path, entry) => {
    if (!entry.dir) {
      const trimmedPath = path.startsWith(moduleName) ? path.slice(moduleName.length + 1) : path;
      promises.push(
        entry.async("text").then(text => {
          files[trimmedPath] = text;
        }),
      );
    }
  });

  await Promise.all(promises);

  return files;
}

interface CustomEditorProps {
  projectName?: string;
  files: FileSet;
  oldFiles?: FileSet;
}

export default function CustomEditor({ projectName, ...rest }: CustomEditorProps) {
  const fileTree = makeFileTree(rest.files, rest.oldFiles);

  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [openFiles, setOpenFiles] = useState<FileTree>({});
  const language = selectedFile ? getLanguage(selectedFile) : undefined;

  function onClickFile(path: string) {
    setOpenFiles({ ...openFiles, [path]: fileTree[path] });
    setSelectedFile(path);
  }

  function onCloseTab(path: string) {
    const newFiles = { ...openFiles };
    delete newFiles[path];
    setOpenFiles(newFiles);

    if (path === selectedFile) {
      const filePaths = Object.keys(newFiles);
      if (filePaths.length > 0) {
        let index = Object.keys(openFiles).indexOf(path);
        if (index >= filePaths.length) index = filePaths.length - 1;
        setSelectedFile(filePaths[index]);
      } else {
        setSelectedFile(undefined);
      }
    }
  }

  const isTablet = useBreakpoint("tablet");

  const selectedValue = selectedFile ? fileTree[selectedFile] : undefined;
  let editor: React.ReactNode;

  if (selectedValue) {
    const { oldContent, newContent } = selectedValue;
    const commonEditorProps = {
      language: language,
      theme: "vs-dark",
      options: {
        readOnly: true,
        automaticLayout: true,
        lineNumbers: isTablet ? "on" : "off",
        minimap: { enabled: isTablet },
        scrollbar: {
          vertical: isTablet ? "auto" : "hidden",
          horizontal: isTablet ? "auto" : "hidden",
        },
      },
    } as const;

    if (rest.oldFiles && oldContent !== newContent) {
      editor = <DiffEditor original={oldContent} modified={newContent} {...commonEditorProps} />;
    } else {
      editor = (
        <Editor
          value={selectedFile ? fileTree[selectedFile].newContent : undefined}
          {...commonEditorProps}
        />
      );
    }
  } else {
    editor = <Box width="100%" height="100%" sx={{ backgroundColor: Colors.EDITOR_BACKGROUND }} />;
  }

  return (
    <Box
      display="flex"
      sx={{
        width: "100%",
        height: "100%",
        flexDirection: { mobile: "column", tablet: "row" },
      }}
    >
      <Box
        sx={{
          width: { mobile: "100%", tablet: 250 },
          height: { mobile: 150, tablet: "100%" },
          backgroundColor: "#252526",
          color: Colors.TEXT,
          flexShrink: 0,
        }}
      >
        <Box p={1} pl={2}>
          <Typography {...typoProps} fontSize={11}>
            EXPLORER: {projectName?.toUpperCase()}
          </Typography>
        </Box>
        <TreeList files={fileTree} onClickFile={onClickFile} />
      </Box>
      <Box
        display="flex"
        flexDirection="column"
        sx={{ flexGrow: 1, height: "100%", flexShrink: 1 }}
      >
        <TabList
          files={openFiles}
          selectedFile={selectedFile}
          onSwitchTab={setSelectedFile}
          onCloseTab={onCloseTab}
        />
        {editor}
      </Box>
    </Box>
  );
}
