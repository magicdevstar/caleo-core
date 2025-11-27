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
  RHFGQLSearchAutocomplete,
  RHFSwitch,
  RHFTextField
} from 'src/components/hook-form';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
import { useFeatures } from 'src/hooks/use-features';
import { useFormContext } from 'react-hook-form';
import { GET_ASSIGNMENT_DIVISIONS } from 'src/api/assignmentDivision';
import { GET_ASSIGNMENT_GROUPS } from 'src/api/assignmentGroup';
import { GET_BRANCHES } from 'src/api/branch';

interface Props {
  disabledInput?: boolean;
  checkLabel?: string;
  includeAssignmentFields?: boolean;
}

export const EditReportingLocation = ({
  disabledInput,
  checkLabel,
  includeAssignmentFields,
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
            <GeoFenceDefinition checkLabel={checkLabel} disabledInput={disabledInput} />

            {lasdEventFields && (
              <>
                <RHFTextField disabled={disabledInput} name="uniform" label="Uniform" />
                <RHFTextField disabled={disabledInput} name="radioFrequency" label="Radio Frequency" />
                <RHFDateTimePicker disabled={disabledInput} name="briefingTime" label="Briefing Time" />
                <RHFTextField disabled={disabledInput} name="briefingLocation" label="Briefing Location" />
                <RHFSwitch name="bypassDemobilization" label="Bypass Demobilization" />
                {
                  includeAssignmentFields && (
                    <Stack spacing={3}>
                      <Stack direction="row" spacing={1.5}>
                        <RHFGQLSearchAutocomplete
                          name="assignmentDivision"
                          label="Division"
                          query={GET_ASSIGNMENT_DIVISIONS}
                          responseKey='assignmentDivisions'
                        />
                        <RHFGQLSearchAutocomplete
                          name="assignmentGroup"
                          label="Group"
                          query={GET_ASSIGNMENT_GROUPS}
                          responseKey='assignmentGroups'
                        />
                      </Stack>
                      <Stack direction="row" spacing={1.5}>
                        <RHFGQLSearchAutocomplete
                          name="branch"
                          label="Branch"
                          query={GET_BRANCHES}
                          responseKey='branches'
                        />
                      </Stack>
                    </Stack>
                  )
                }
              </>
            )}
          </Stack>
        </Card>
      </Grid>
    </>
  );
};
