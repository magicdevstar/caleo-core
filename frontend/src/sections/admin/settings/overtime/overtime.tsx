import { useMemo } from 'react';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import { useMutation } from '@apollo/client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import omitDeep from 'omit-deep';
import { capitalize } from 'lodash';
// @mui
import CardHeader from "@mui/material/CardHeader";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
import { TimePicker } from '@mui/x-date-pickers';
// Hooks
import { useSnackbar } from 'notistack';
import FormProvider, { FormFooter, RHFSelect, RHFSwitch, RHFTextField } from 'src/components/hook-form';
// Components
import { useResponsive } from 'src/hooks/use-responsive';
import { ORGANIZATION, UPDATE_ORGANIZATION } from 'src/api/organization';
import { DayOfWeek, MemberTier, Organization, OrganizationOvertimeSettings } from 'src/__generated__/resolvers-types';

const tierNames = {
  [MemberTier.Tier_1]: 'Tier 1',
  [MemberTier.Tier_2]: 'Tier 2',
};

export default function Overtime({
  organization
}: {
  organization: Organization;
}) {
  const mdUp = useResponsive('up', 'md');

  const [updateOrganization] = useMutation(UPDATE_ORGANIZATION, {
    refetchQueries: [ORGANIZATION],
  });

  const { enqueueSnackbar } = useSnackbar();

  const NewOvertimeSchema = Yup.object().shape({
    id: Yup.string().required(),
    name: Yup.string().required(),
    settings: Yup.object().shape({
      shiftsPerWeek: Yup.number().required(),
      lottery: Yup.object().shape({
        open: Yup.object().shape({
          time: Yup.string().required(),
          dayOfWeek: Yup.string().required(),
        }),
        notifyUsersBeforeClose: Yup.number().required(),
        fcfsShiftsDelay: Yup.number().required(),
        enabled: Yup.boolean().required(),
        close:  Yup.object().shape({
          dayOfWeek: Yup.string().required(),
          time: Yup.string().required(),
        }),
      }),
      shiftBuffer: Yup.object().shape({
        minuteShiftBuffer: Yup.number().required(),
        enabled: Yup.boolean().required(),
        adminOverrideShiftBuffer: Yup.boolean().required(),
      }),
      userRelinquishShift: Yup.object().shape({
        enabled: Yup.boolean().required(),
        numberOfHoursBeforeShift: Yup.number().required(),
        requireNoteWhenRelinquishing: Yup.boolean().required(),
        afterShiftRemove: Yup.object().shape({
          days: Yup.number().required(),
          tier: Yup.string().required(),
        }),
      }),
      shiftReminder: Yup.object().shape({
        enabled: Yup.boolean().required(),
        time: Yup.number().required(),
        unit: Yup.string().required(),
      }),
    }),
  });

  const defaultValues = useMemo(
    () => ({
      id: organization?.id,
      name: organization?.name,
      settings: omitDeep(JSON.parse(JSON.stringify(organization.settings)), ['__typename']) as OrganizationOvertimeSettings,
    }),
    [organization]
  );

  const methods = useForm({
    resolver: yupResolver(NewOvertimeSchema) as any,
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
    getValues,
    setValue,
  } = methods;

  
  const values = getValues();

  const onSubmit = handleSubmit(async (formData) => {
    try {
      await updateOrganization({
        variables: {
          organization: {
            id: formData.id,
            name: formData.name,
            settings: formData.settings,
          },
        },
      });
      enqueueSnackbar('Update success!');
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3} sx={{ mt: 2, width: '100%', marginLeft: 0 }}>
        {mdUp && (
          <Grid md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Shift Settings
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Max shifts per week
            </Typography>
          </Grid>
        )}
        <Grid xs={12} md={8} sx={{ mb: 2 }}>
          <Card>
            {!mdUp && <CardHeader title="Shift Settings" />}
            <Stack spacing={3} sx={{ p: 3 }}>
              <RHFTextField
                type="number"
                name="settings.shiftsPerWeek"
                label="Max shifts per week"
                helperText="The maximum number of overtime shifts a user can sign up for in a week"
              />
            </Stack>
          </Card>
        </Grid>

        {mdUp && (
          <Grid md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Lottery
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Enable lottery, Set lottery open/close time, fcfs shifts, notifications, etc.
            </Typography>
          </Grid>
        )}
        <Grid xs={12} md={8} sx={{ mb: 2 }}>
          <Card>
            {!mdUp && <CardHeader title="Lottery" />}
            <Stack spacing={3} sx={{ p: 3 }}>
              <RHFSwitch name="settings.lottery.enabled" label="Enable lottery" />
              <RHFTextField
                type="number"
                name="settings.lottery.notifyUsersBeforeClose"
                label="Notification"
                InputProps={{
                  endAdornment: <InputAdornment position="end">/Hours</InputAdornment>,
                }}
                helperText="The number of hours before the lottery closes that users will be notified"
              />
              <RHFTextField
                type="number"
                name="settings.lottery.fcfsShiftsDelay"
                label="FCFS shifts delay"
                InputProps={{
                  endAdornment: <InputAdornment position='end'>/hours</InputAdornment>
                }}
                helperText="The number of hours after the lottery window closes that FCFS shifts will become available"
              />

              <Stack direction="row" alignItems="center" spacing={2} sx={{ pb: 2 }}>
                <Stack sx={{ width: '100%' }} spacing={2}>
                  <RHFSelect
                    name="settings.lottery.open.dayOfWeek"
                    label="Lottery Open"
                    helperText="The day of the week the lottery opens"
                  >
                    {[
                      DayOfWeek.Sunday,
                      DayOfWeek.Monday,
                      DayOfWeek.Tuesday,
                      DayOfWeek.Wednesday,
                      DayOfWeek.Thursday,
                      DayOfWeek.Friday,
                      DayOfWeek.Saturday,
                    ].map((option) => (
                      <MenuItem key={option} value={option}>
                        {capitalize(option)}
                      </MenuItem>
                    ))}
                  </RHFSelect>
                  <TimePicker
                    label="Open"
                    timezone='UTC'
                    value={dayjs.utc(values.settings.lottery.open.time)}
                    onChange={(newValue: any) => {
                      setValue('settings.lottery.open.time', newValue);
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                      },
                    }}
                  />
                </Stack>
                <Stack sx={{ width: '100%' }} spacing={2}>
                  <RHFSelect
                    name="settings.lottery.close.dayOfWeek"
                    label="Lottery Close"
                    helperText="The day of the week the lottery closes"
                  >
                    {[
                      DayOfWeek.Sunday,
                      DayOfWeek.Monday,
                      DayOfWeek.Tuesday,
                      DayOfWeek.Wednesday,
                      DayOfWeek.Thursday,
                      DayOfWeek.Friday,
                      DayOfWeek.Saturday,
                    ].map((option) => (
                      <MenuItem key={option} value={option}>
                        {capitalize(option)}
                      </MenuItem>
                    ))}
                  </RHFSelect>
                  <TimePicker
                    label="Close"
                    timezone='UTC'
                    value={dayjs.utc(values.settings.lottery.close.time)}
                    onChange={(newValue: any) => {
                      setValue('settings.lottery.close.time', newValue);
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                      },
                    }}
                  />
                </Stack>
              </Stack>

            </Stack>
          </Card>
        </Grid>

        {mdUp && (
          <Grid md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Shift Buffer
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Minutes to wait after shift and admin options
            </Typography>
          </Grid>
        )}
        <Grid xs={12} md={8} sx={{ mb: 2 }}>
          <Card>
            {!mdUp && <CardHeader title="Shift Buffer" />}
            <Stack spacing={3} sx={{ p: 3 }}>
              <RHFSwitch name="settings.shiftBuffer.enabled" label="Enable shift buffer" />
              <RHFTextField
                type="number"
                name="settings.shiftBuffer.minuteShiftBuffer"
                label="Buffer time"
                helperText="The number of minutes to wait after a shift before a user can sign up for another shift"
              />
              <RHFSwitch
                name="settings.shiftBuffer.adminOverrideShiftBuffer"
                label="Admin override"
                helperText="Allow admins to override the shift buffer"
              />
            </Stack>
          </Card>
        </Grid>

        {mdUp && (
          <Grid md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Relinquishing shifts
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Setting tier after relinquishing a shift, etc.
            </Typography>
          </Grid>
        )}
        <Grid xs={12} md={8} sx={{ mb: 2 }}>
          <Card>
            {!mdUp && <CardHeader title="Shift Buffer" />}
            <Stack spacing={3} sx={{ p: 3 }}>
              <RHFSwitch name="settings.userRelinquishShift.enabled" label="Enable user relinquish shifts" />
              <RHFSwitch
                name="settings.userRelinquishShift.requireNoteWhenRelinquishing"
                label="Require Note"
                helperText="Require a note when relinquishing a shift"
              />
              <RHFTextField
                type="number"
                name="settings.userRelinquishShift.numberOfHoursBeforeShift"
                label="Hours before shift"
                helperText="The number of hours before a shift starts that a user can relinquish a shift"
              />
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                After a user removes a shift
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: '25px', pl: 1 }}>
                <RHFSelect
                  name="settings.userRelinquishShift.afterShiftRemove.tier"
                  label="Tier"
                  helperText="The tier to set a user to after relinquishing a shift"
                >
                  {[
                    MemberTier.Tier_1,
                    MemberTier.Tier_2,
                  ].map((option) => (
                    <MenuItem key={option} value={option}>
                      {(tierNames as any)[option]}
                    </MenuItem>
                  ))}
                </RHFSelect>
                <RHFTextField
                  type="number"
                  name="settings.userRelinquishShift.afterShiftRemove.days"
                  label="Days in selected tier"
                  helperText="The number of days to set a user to the selected tier after relinquishing a shift"
                />
              </Box>
            </Stack>
          </Card>
        </Grid>

        {mdUp && (
          <Grid md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Shift Reminders
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Shift notification settings
            </Typography>
          </Grid>
        )}
        <Grid xs={12} md={8} sx={{ mb: 2 }}>
          <Card>
            {!mdUp && <CardHeader title="Shift Reminders" />}
            <Stack spacing={3} sx={{ p: 3 }}>
              <RHFSwitch name="settings.shiftReminder.enabled" label="Enable shift reminders" />
              <RHFTextField
                type="number"
                name="settings.shiftReminder.time"
                label="hours before shift"
                helperText="The number of hours before a shift to send a reminder"
              />
            </Stack>
          </Card>
        </Grid>
      </Grid>
      <FormFooter sx={{ p: 5 }}>
        <LoadingButton
          type="submit"
          variant="contained"
          loading={isSubmitting}
          sx={{ ml: 2 }}
        >
          Save
        </LoadingButton>
      </FormFooter>
    </FormProvider>
  )
};
