import Stack from "@mui/material/Stack";
import { RHFSwitch } from "src/components/hook-form";

export default function MutualAidStep() {
  return (
    <Stack spacing={2}>
      <RHFSwitch name="isMutualAid" label="Did any part of your shift include providing mutual aid assistance outside the County Area of Responsibility (AOR) or to a different Law Enforcement Agency?" />
    </Stack>
  );
}
