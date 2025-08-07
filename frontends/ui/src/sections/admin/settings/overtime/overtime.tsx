import { useMemo } from 'react';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { useMutation } from '@apollo/client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import omitDeep from 'omit-deep';
import { capitalize } from 'lodash';
// @mui
import CardHeader from "@mui/material/CardHeader";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
import { TimePicker } from '@mui/x-date-pickers';
// Hooks
import { useSnackbar } from 'notistack';
import FormProvider, { FormFooter, RHFSelect, RHFSwitch, RHFTextField } from 'src/components/hook-form';
import { useFeatures } from 'src/hooks/use-features';
// Components
import { useResponsive } from 'src/hooks/use-responsive';
import { DefaultEventThumbnail } from 'src/components/events';
import { CREATE_DEFAULT_EVENT_THUMBNAIL_UPLOAD_URL, ORGANIZATION, UPDATE_ORGANIZATION } from 'src/api/organization';
import { DayOfWeek, Organization, OrganizationEventSettingsUpload, OrganizationOvertimeSettings, ShiftReminderUnit } from 'src/__generated__/resolvers-types';
import { useTiers } from 'src/hooks/use-tiers';
import { ME } from 'src/api/user';
import { useAuthContext } from 'src/auth/hooks';
import { maxThumbnailSize } from 'src/utils/event.utils';
import { fData } from 'src/utils/format-number';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function Overtime({
  organization
}: {
  organization: Organization;
}) {
  const {
    eventCheckIn,
    interestLists,
    monthlyMaxHours,
    lasdUserFields,
    lottery,
    weeklyMaxShifts,
  } = useFeatures();
  const { reInitialize } = useAuthContext();
  const { tierNames, enabledTiers } = useTiers();
  const mdUp = useResponsive('up', 'md');

  const [createUploadLink] = useMutation<{defaultEventThumbnailUploadUrl: OrganizationEventSettingsUpload}>(CREATE_DEFAULT_EVENT_THUMBNAIL_UPLOAD_URL);
  const [updateOrganization] = useMutation(UPDATE_ORGANIZATION, {
    refetchQueries: [ORGANIZATION, ME],
  });

  const { enqueueSnackbar } = useSnackbar();

  const NewOvertimeSchema = Yup.object().shape({
    id: Yup.string().required(),
    name: Yup.string().required(),
    settings: Yup.object().shape({
      shiftsPerWeek: Yup.number().required(),
      hoursPerMonth: Yup.number().required(),
      eventSettings: Yup.object().shape({
        allowThumbnail: Yup.boolean().required(),
        defaultThumbnail: Yup.mixed<any>().nullable(),
      }),
      interestList: Yup.object().shape({
        defaultHoursBeforeShift: Yup.number(),
        defaultNotificationTime: Yup.number(),
      }),
      checkInOut: Yup.object().shape({
        minutesBeforeShiftStart: Yup.number(),
        minutesAfterShiftEnd: Yup.number(),
      }),
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
      secondaryShiftReminder: Yup.object().shape({
        enabled: Yup.boolean().required(),
        time: Yup.number().nullable(),
        unit: Yup.string().required(),
      }),
    }),
  });

  const defaultValues: any = useMemo(
    () => {
      const settings = omitDeep(JSON.parse(JSON.stringify(organization.settings)), ['__typename']) as OrganizationOvertimeSettings;
      return {
        id: organization?.id,
        name: organization?.name,
        settings: {
          ...settings,
          secondaryShiftReminder: {
            ...settings.secondaryShiftReminder,
            enabled: settings.secondaryShiftReminder?.enabled || false,
            time: settings.secondaryShiftReminder?.time || 7,
            unit: settings.secondaryShiftReminder?.unit || ShiftReminderUnit.Day,
          }
        },
      }
    },
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
    watch,
  } = methods;

  const secondaryShiftReminderUnit = watch('settings.secondaryShiftReminder.unit');
  const allowThumbnail = watch('settings.eventSettings.allowThumbnail');
  const values = getValues();

  const onSubmit = handleSubmit(async (formData) => {
    try {
      // Handle thumbnail - if it's a file object with existing=true, don't send it
      // If it's a new file, it would need to be uploaded to S3 first (similar to account-general.tsx)
      const settingsToSend = { ...formData.settings };
      
      // If the thumbnail is a file object, we need to handle it differently
      if (settingsToSend.eventSettings?.defaultThumbnail && 
          typeof settingsToSend.eventSettings.defaultThumbnail === 'object') {
        if (settingsToSend.eventSettings.defaultThumbnail.existing) {
          // Don't send file objects for existing thumbnails - keep the original URL
          delete settingsToSend.eventSettings.defaultThumbnail;
        } else {
          const res = await createUploadLink();
          if (res.data) {
            await fetch(res.data.defaultEventThumbnailUploadUrl.uploadUrl, {
              method: 'PUT',
              body: settingsToSend.eventSettings.defaultThumbnail,
              headers: {
                'Content-Type': settingsToSend.eventSettings.defaultThumbnail.type,
              },
            });
            settingsToSend.eventSettings.defaultThumbnail = res.data?.defaultEventThumbnailUploadUrl.imagePath;
          }
        }
      }

      await updateOrganization({
        variables: {
          organization: {
            id: formData.id,
            name: formData.name,
            settings: {
              ...settingsToSend,
              checkInOut: {
                ...settingsToSend.checkInOut,
              },
              interestList: {
                ...settingsToSend.interestList,
              },
              lottery: {
                ...settingsToSend.lottery,
                open: {
                  ...settingsToSend.lottery.open,
                  time: dayjs(settingsToSend.lottery.open.time).toDate().toISOString(),
                },
                close: {
                  ...settingsToSend.lottery.close,
                  time: dayjs(settingsToSend.lottery.close.time).toDate().toISOString(),
                },
              },
            },
          },
        },
      });
      await reInitialize();
      enqueueSnackbar('Update success!');
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {mdUp && (
          <Grid md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Event Settings
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Allow thumbnail for events, etc.
            </Typography>
          </Grid>
        )}
        <Grid xs={12} md={8} sx={{ mb: 2 }}>
          <Card>
            {!mdUp && <CardHeader title="Event Settings" />}
            <Stack spacing={3} sx={{ p: 3 }}>
              <RHFSwitch
                name="settings.eventSettings.allowThumbnail"
                label="Allow Thumbnail"
                helperText="Allow a thumbnail upload for events that will be displayed to all Caleo users"
              />
              {
                allowThumbnail && (
                  <DefaultEventThumbnail
                    name="settings.eventSettings.defaultThumbnail"
                    thumbnailUrl={organization.settings?.eventSettings?.defaultThumbnail}
                    maxSize={maxThumbnailSize}
                    helperText={`Upload a default thumbnail image that will be used for events when no custom thumbnail is provided. Max size of ${fData(maxThumbnailSize)}. Suggested size is 250x175px.`}
                  />
                )
              }
            </Stack>
          </Card>
        </Grid>
        {mdUp && (weeklyMaxShifts || monthlyMaxHours) && (
          <Grid md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Shift Settings
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Max shifts per week
            </Typography>
          </Grid>
        )}
        {
          (weeklyMaxShifts || monthlyMaxHours) && (
            <Grid xs={12} md={8} sx={{ mb: 2 }}>
              <Card>
                {!mdUp && <CardHeader title="Shift Settings" />}
                <Stack spacing={3} sx={{ p: 3 }}>
                  {
                    weeklyMaxShifts && (
                      <RHFTextField
                        type="number"
                        name="settings.shiftsPerWeek"
                        label="Max shifts per week"
                        helperText="The maximum number of overtime shifts a user can sign up for in a week"
                      />
                    )
                  }

                  {
                    monthlyMaxHours && (
                      <RHFTextField
                        type="number"
                        name="settings.hoursPerMonth"
                        label="Max hours per month"
                        helperText="The maximum number of overtime hours a user can work per month"
                      />
                    )
                  }
                </Stack>
              </Card>
            </Grid>
          )
        }

        {
          eventCheckIn && (
            <>
              {mdUp && (
                <Grid md={4}>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Check In/Out
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Change the time before and after a shift start the check in and out button will be available
                  </Typography>
                </Grid>
              )}
              <Grid xs={12} md={8} sx={{ mb: 2 }}>
                <Card>
                  {!mdUp && <CardHeader title="Check In/Out" />}
                  <Stack spacing={3} sx={{ p: 3 }}>
                    <RHFTextField
                      type="number"
                      name="settings.checkInOut.minutesBeforeShiftStart"
                      label="Minutes before shift start"
                      helperText="The number of minutes before a shift starts that the check in button will be available"
                    />
                    <RHFTextField
                      type="number"
                      name="settings.checkInOut.minutesAfterShiftEnd"
                      label="Minutes after shift end"
                      helperText="The number of minutes after a shift ends that the check out button will be available"
                    />
                  </Stack>
                </Card>
              </Grid>
            </>
          )
        }

        {
          interestLists && (
            <>
              {mdUp && (
                <Grid md={4}>
                  <Typography variant="h6" sx={{ mb: 0.5 }}>
                    Interest Lists
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Set the default hours before a shift that an interest list will no longer accept new submissions and when to notify officers
                  </Typography>
                </Grid>
              )}
              <Grid xs={12} md={8} sx={{ mb: 2 }}>
                <Card>
                  {!mdUp && <CardHeader title="Check In/Out" />}
                  <Stack spacing={3} sx={{ p: 3 }}>
                    <RHFTextField
                      type="number"
                      name="settings.interestList.defaultHoursBeforeShift"
                      label="Hours Before Shift"
                      helperText="The default number of hours before a shift starts that officers wil no longer be able to submit interest. This is configurable per event."
                    />
                    <RHFTextField
                      type="number"
                      name="settings.interestList.defaultAutoHireCutoff"
                      label="Auto hire cut off"
                      helperText="The number of days prior to event start when auto hire will no longer do automatic assignments. This is configurable per event."
                    />
                    <RHFTextField
                      type="number"
                      name="settings.interestList.defaultNotificationTime"
                      label="Notify Hours Before End"
                      helperText="Hours to before the interests list end to notify eligible officers."
                    />
                  </Stack>
                </Card>
              </Grid>
            </>
          )
        }

        {mdUp && lottery && (
          <Grid md={4}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              Lottery
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Enable lottery, Set lottery open/close time, fcfs shifts, notifications, etc.
            </Typography>
          </Grid>
        )}
        {
          lottery && (
            <Grid xs={12} md={8} sx={{ mb: 2 }}>
              <Card>
                {!mdUp && <CardHeader title="Lottery" />}
                <Stack spacing={3} sx={{ p: 3 }}>
                  <RHFSwitch name="settings.lottery.enabled" disabled label="Enable lottery" />
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
                        disabled={window.location.hostname !== 'localhost'}
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
                        timezone={organization?.timezone}
                        disabled={window.location.hostname !== 'localhost'}
                        ampm={false}
                        timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
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
                        disabled={window.location.hostname !== 'localhost'}
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
                        timezone={organization?.timezone}
                        disabled={window.location.hostname !== 'localhost'}
                        ampm={false}
                        timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
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
          )
        }

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
              Scratching shifts
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Setting tier after scratching a shift, etc.
            </Typography>
          </Grid>
        )}
        <Grid xs={12} md={8} sx={{ mb: 2 }}>
          <Card>
            {!mdUp && <CardHeader title="Shift Buffer" />}
            <Stack spacing={3} sx={{ p: 3 }}>
              <RHFSwitch name="settings.userRelinquishShift.enabled" label="Enable user scratch shifts" />
              <RHFSwitch
                name="settings.userRelinquishShift.requireNoteWhenRelinquishing"
                label="Require Note"
                helperText="Require a note when scratching a shift"
              />
              <RHFTextField
                type="number"
                name="settings.userRelinquishShift.numberOfHoursBeforeShift"
                label="Hours before shift"
                helperText="The number of hours before a shift starts that a user can scratch a shift"
              />
              {
                !lasdUserFields && (
                  <>
                    <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                      After a user scratches a shift
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '25px', pl: 1 }}>
                      <RHFSelect
                        name="settings.userRelinquishShift.afterShiftRemove.tier"
                        label="Tier"
                        helperText="The tier to set a user to after scratching a shift"
                      >
                        {enabledTiers.map((option) => (
                          <MenuItem key={option} value={option}>
                            {tierNames[option]}
                          </MenuItem>
                        ))}
                      </RHFSelect>
                      <RHFTextField
                        type="number"
                        name="settings.userRelinquishShift.afterShiftRemove.days"
                        label="Days in selected tier"
                        helperText="The number of days to set a user to the selected tier after scratching a shift"
                      />
                    </Box>
                  </>
                )
              }
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
              <RHFSwitch name="settings.shiftReminder.enabled" label="Enable shift reminder" />
              <RHFTextField
                type="number"
                name="settings.shiftReminder.time"
                label="hours before shift"
                helperText="The number of hours before a shift to send a reminder"
              />

              <RHFSwitch name="settings.secondaryShiftReminder.enabled" label="Enable secondary shift reminder" />
              <Stack direction="row" alignContent="center" spacing={2}>
                <RHFTextField
                  type="number"
                  name="settings.secondaryShiftReminder.time"
                  label={`${secondaryShiftReminderUnit === ShiftReminderUnit.Day ? 'Days' : 'Hours'} before shift`}
                />
                <RHFSelect
                  name="settings.secondaryShiftReminder.unit"
                  label="Unit"
                  helperText="The unit of time for the secondary shift reminder"
                >
                  <MenuItem value={ShiftReminderUnit.Hour}>
                    Hours
                  </MenuItem>
                  <MenuItem value={ShiftReminderUnit.Day}>
                    Days
                  </MenuItem>
                </RHFSelect>
              </Stack>
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
