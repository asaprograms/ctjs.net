import { Box } from "@mui/joy";

interface Props {
  children: React.ReactNode;
}

export function Mobile({ children }: Props) {
  return <Box display={{ mobile: "inherit", tablet: "none" }}>{children}</Box>;
}

export function NotMobile({ children }: Props) {
  return <Box display={{ mobile: "none", tablet: "inherit" }}>{children}</Box>;
}
