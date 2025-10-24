// @mui
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

// components
import {
  RHFTextField,
  RHFSigningAuthorityAutocomplete,
  RHFUserAutocomplete,
} from 'src/components/hook-form';

// hooks
import { useResponsive } from 'src/hooks/use-responsive';

// types
import { Event } from 'src/__generated__/resolvers-types';
import RHFPhoneField from '../hook-form/rhf-phone-field';

interface IProps {
  currentEvent?: Event;
  allDisabled: boolean;
  isIncident: boolean;
}

export const LASDDetails = ({
  currentEvent,
  allDisabled,
  isIncident,
}: IProps) => {
  const mdUp = useResponsive('up', 'md');
  return (
    <>
      {mdUp && (
        <Grid md={2}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Overtime Details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Details here will be used on overtime slips.
          </Typography>
        </Grid>
      )}
      <Grid xs={12} md={10}>
        <Card>
          {!mdUp && <CardHeader title="Details" />}
          <Stack spacing={4} sx={{ p: 4, pl: 3, pr: 3 }}>
            {!isIncident &&
              <Stack direction="row" spacing={1.5}>
                <RHFTextField
                  name="bodyWarnTag"
                  label="Body Warn Tag"
                  disabled={allDisabled}
                />
                <RHFPhoneField
                  name="commandPostContactNumber"
                  label="Command Post Contact Number"
                  disabled={allDisabled}
                />
              </Stack>
            }
            <Stack direction="row" spacing={1.5}>
              <RHFTextField
                name="ocn"
                label="OCN"
                disabled={allDisabled}
              />
              <RHFTextField
                name="outsideOrgCode"
                label="Outside Org Code"
                defaultValue="15778"
                disabled={allDisabled}
              />
            </Stack>
            <Stack direction="row" spacing={1.5}>
              <RHFTextField
                name="overtimeReasonCode"
                label="Overtime Reason Code"
                disabled={allDisabled}
              />
              <RHFTextField
                name="budgetActivityCode"
                label="Budget activity code"
                disabled={allDisabled}
              />
            </Stack>
            {
              !isIncident && (
                <>
                  <Stack direction="row" spacing={1.5}>
                    <RHFSigningAuthorityAutocomplete
                      eventId={currentEvent?.id}
                      name="supervisorAssignment"
                      label='Pre-Approval Supervisor'
                      disabled={allDisabled}
                      helperText="Supervisor assignment that oversees the event and will be included on all shift documents"
                    />
                    <RHFSigningAuthorityAutocomplete
                      eventId={currentEvent?.id}
                      name="lieutenantAssignment"
                      label='Signing Supervisor'
                      disabled={allDisabled}
                      helperText="Supervisor assignment that will sign off all shift confirmation documents."
                    />
                  </Stack>
                  <Stack direction="row" spacing={1.5}>
                    <RHFSigningAuthorityAutocomplete
                      eventId={currentEvent?.id}
                      name="fieldSupervisorAssignment"
                      label='Field Supervisor'
                      disabled={allDisabled}
                      helperText="Field Supervisor assignment."
                    />

                    <RHFUserAutocomplete
                      name="overrideSupervisor"
                      label="Outside Supervisor"
                      disabled={allDisabled}
                    />
                  </Stack>
                </>
              )
            }
            <RHFTextField
              name="overtimeNarrative"
              label="Overtime Narrative"
              disabled={allDisabled}
              multiline
              rows={4}
            />
          </Stack>  
        </Card>
      </Grid>
    </>
  );
}