import { Button } from "@mui/joy";

export default function ProviderButton(props: React.ComponentProps<typeof Button>) {
  return (
    <Button
      {...props}
      sx={{
        my: 2,
        width: "100%",
        backgroundColor: theme => theme.vars.palette.secondary[400],
        ...(props.sx ?? {}),
      }}
      type="submit"
    />
  );
}
