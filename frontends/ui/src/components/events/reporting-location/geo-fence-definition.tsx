// @mui
import Stack from "@mui/material/Stack";
// hooks
import { useFeatures } from "src/hooks/use-features";
import { useWatch } from "react-hook-form";
// components
import { RHFDateTimePicker, RHFSwitch, RHFTextField } from "src/components/hook-form";
import { RHFMapWithBoundingBox } from 'src/components/map/map-bounding-box';
import RHFAutocompleteGeocode from "src/components/hook-form/rhf-autocomplete-geocode";

interface Props {
  checkName?: string;
  checkLabel?: string;
  disabled?: boolean;
  disabledInput?: boolean;
  geoName?: string;
  reportingLocationName?: string;
};

export function GeoFenceDefinition({
  disabled,
  disabledInput,
  checkName = "allowOfficerCheckIn",
  checkLabel = "Allow Remote Check In/Out",
  geoName = "geoFence",
  reportingLocationName = "reportingLocationPosition",
}: Props) {
  const { officerCheckInOut, lasdEventFields, mapboxReportingLocation } = useFeatures();
  
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

      {isEnabled && (
        <>
          {lasdEventFields && (
            <>
              <RHFDateTimePicker disabled={disabledInput} name="reportingTime" label="Reporting Time" />
              {
                mapboxReportingLocation ? (
                  <RHFAutocompleteGeocode disabled={disabledInput} name="reportingLocationAddress" label="Reporting Location" />
                ) : (
                  <RHFTextField disabled={disabledInput} name="reportingLocation" label="Reporting Location" />
                )
              }
            </>
          )}
          <RHFMapWithBoundingBox name={geoName} pinName={reportingLocationName} />
        </>
      )}
    </Stack>
  );
}
