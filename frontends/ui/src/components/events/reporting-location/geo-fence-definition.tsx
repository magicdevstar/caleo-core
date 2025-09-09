// @mui
import Stack from "@mui/material/Stack";
// hooks
import { useFeatures } from "src/hooks/use-features";
import { useWatch } from "react-hook-form";
// components
import { RHFSwitch } from "src/components/hook-form";
import { RHFMapWithBoundingBox } from 'src/components/map/map-bounding-box';

interface Props {
  checkName?: string;
  checkLabel?: string;
  disabled?: boolean;
  geoName?: string;
};

export function GeoFenceDefinition({
  disabled,
  checkName = "allowOfficerCheckIn",
  checkLabel = "Allow Remote Check In/Out",
  geoName = "geoFence"
}: Props) {
  const { officerCheckInOut } = useFeatures();
  
  // Watch the switch value to conditionally show the map
  const isEnabled = useWatch({ name: checkName });
  
  if (!officerCheckInOut) {
    return null;
  }

  return (
    <Stack spacing={2}>
      <RHFSwitch
        disabled={disabled}
        name={checkName}
        label={checkLabel}
      />

      {isEnabled && <RHFMapWithBoundingBox name={geoName} />}
    </Stack>
  );
}
