import { useEffect } from 'react';
// @mui
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
// components
import { GeoFenceDefinition } from 'src/components/events/reporting-location/geo-fence-definition';
import {
  RHFDateTimePicker,
  RHFTextField
} from 'src/components/hook-form';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
import { useFeatures } from 'src/hooks/use-features';
import RHFAutocompleteGeocode from 'src/components/hook-form/rhf-autocomplete-geocode';
import { useFormContext } from 'react-hook-form';

interface Props {
  disabledInput?: boolean;
  checkLabel?: string;
}

export const EditReportingLocation = ({
  disabledInput,
  checkLabel
}: Props) => {
  const { mapboxReportingLocation } = useFeatures();
  const { watch, setValue } = useFormContext();
  const address = watch('reportingLocationAddress');
  const reportingLocation = watch('reportingLocation');

  useEffect(() => {
    // Only set when the address is selected from mapbox
    if (address?.geometry?.coordinates) {
      const point = address.geometry.coordinates;
      setValue('reportingLocation', address.place_name_en);
      setValue('reportingLocationPosition', point);
    }
  }, [address, setValue]);

  // Allow syncing to mapbox field if the feature is turned off :)
  useEffect(() => {
    if (!mapboxReportingLocation) {
      setValue('reportingLocationAddress', {
        id: reportingLocation,
        place_name: reportingLocation,
        place_name_en: reportingLocation,
      });
    }
  }, [setValue, mapboxReportingLocation, reportingLocation]);

  const mdUp = useResponsive('up', 'md');
  const { officerCheckInOut, lasdEventFields } = useFeatures();

  if (!officerCheckInOut && !lasdEventFields) {
    return null;
  }

  return (
    <>
      {mdUp && (
        <Grid md={2}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Reporting Details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Officer reporting details
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={10}>
        <Card>
          {!mdUp && <CardHeader title="Reporting Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <GeoFenceDefinition checkLabel={checkLabel} />

            {lasdEventFields && (
              <>
                {
                  mapboxReportingLocation ? (
                    <RHFAutocompleteGeocode disabled={disabledInput} name="reportingLocationAddress" label="Reporting Location" />
                  ) : (
                    <RHFTextField disabled={disabledInput} name="reportingLocation" label="Reporting Location" />
                  )
                }
                <RHFTextField disabled={disabledInput} name="uniform" label="Uniform" />
                <RHFDateTimePicker disabled={disabledInput} name="briefingTime" label="Briefing Time" />
                <RHFTextField disabled={disabledInput} name="briefingLocation" label="Briefing Location" />
              </>
            )}
          </Stack>
        </Card>
      </Grid>
    </>
  );
};
