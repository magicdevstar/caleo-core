import { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { GeoFenceDefinition } from "src/components/events/reporting-location/geo-fence-definition";
import { RHFDateTimePicker, RHFSwitch, RHFTextField } from "src/components/hook-form";
import { EditSection } from "../common/section";

interface Props {
  disabled?: boolean;
}

export const AssignmentReportingInstructionSection = ({
  disabled
}: Props) => {
  const { watch, setValue } = useFormContext();
  const address = watch('reportingLocationAddress');

  useEffect(() => {
    // Only set when the address is selected from mapbox
    if (address?.geometry?.coordinates) {
      const point = address.geometry.coordinates;
      setValue('reportingLocationPosition', point);
    }
  }, [address, setValue]);

  return (
    <EditSection title="Reporting Instructions" description="Geo fence, reporting time, uniform, etc.">
      <GeoFenceDefinition checkLabel="Set Assignment-Specific Check-in/out Location" disabledInput={disabled} />
      <RHFTextField disabled={disabled} name="uniform" label="Uniform" />
      <RHFDateTimePicker disabled={disabled} name="briefingTime" label="Briefing Time" />
      <RHFTextField disabled={disabled} name="briefingLocation" label="Briefing Location" />
      <RHFSwitch name="includeDriveTime" label="Include Drive Time" />
      <RHFSwitch name="bypassDemobilization" label="Bypass Demobilization" />
    </EditSection>
  );
}
