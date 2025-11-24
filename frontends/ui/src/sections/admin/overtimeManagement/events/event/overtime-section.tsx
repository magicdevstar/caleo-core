import Stack from "@mui/material/Stack";
import { RHFTextField } from "src/components/hook-form";
import { EditSection } from "src/sections/admin/overtimeManagement/events/common/section";

interface Props {
  disabled?: boolean;
}

export const EventOvertimeSection = ({ disabled }: Props) => {
  return (
    <EditSection title="Overtime" description="OCN, Org Code, etc.">
      <Stack direction="row" spacing={1.5}>
        <RHFTextField
          name="ocn"
          label="OCN"
          disabled={disabled}
        />
        <RHFTextField
          name="outsideOrgCode"
          label="Outside Org Code"
          defaultValue="15778"
          disabled={disabled}
        />
      </Stack>
      <Stack direction="row" spacing={1.5}>
        <RHFTextField
          name="overtimeReasonCode"
          label="Overtime Reason Code"
          disabled={disabled}
        />
        <RHFTextField
          name="budgetActivityCode"
          label="Budget activity code"
          disabled={disabled}
        />
      </Stack>

      <RHFTextField
        name="overtimeNarrative"
        label="Overtime Narrative"
        disabled={disabled}
        multiline
        rows={4}
      />
    </EditSection>
  );
}