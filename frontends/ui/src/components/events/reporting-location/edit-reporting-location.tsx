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

interface Props {
  disabledInput?: boolean;
}

export const EditReportingLocation = ({
  disabledInput
}: Props) => {
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
            Reporting Location
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Officer reporting details
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={10}>
        <Card>
          {!mdUp && <CardHeader title="Reporting Location" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <GeoFenceDefinition />

            {lasdEventFields && (
              <>
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
