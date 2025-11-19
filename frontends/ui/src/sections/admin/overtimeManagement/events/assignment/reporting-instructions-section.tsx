import { GeoFenceDefinition } from "src/components/events/reporting-location/geo-fence-definition";
import { RHFDateTimePicker, RHFTextField } from "src/components/hook-form";
import { EditSection } from "../common/section";

interface Props {
  disabled?: boolean;
}

export const AssignmentReportingInstructionSection = ({
  disabled
}: Props) => (
  <EditSection title="Reporting Instructions" description="Geo fence, reporting time, uniform, etc.">
    <GeoFenceDefinition checkLabel="Set Assignment-Specific Check-in/out Location" disabledInput={disabled} />
    <RHFTextField disabled={disabled} name="uniform" label="Uniform" />
    <RHFDateTimePicker disabled={disabled} name="briefingTime" label="Briefing Time" />
    <RHFTextField disabled={disabled} name="briefingLocation" label="Briefing Location" />
  </EditSection>
);
