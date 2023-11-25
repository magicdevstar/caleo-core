import { useMemo, useEffect, useCallback, useState } from 'react';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { gql, useMutation, useQuery } from '@apollo/client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { isAfter, isBefore } from 'date-fns';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Card from '@mui/material/Card';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import Box from '@mui/material/Box';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// types
import {
  Assignment,
  Event,
  EventStatus,
  LotteryCounter,
  Shift,
  Venue,
  VenueStatus,
} from 'src/__generated__/resolvers-types';
// components
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFEditor,
  RHFTextField,
  RHFSelect,
  RHFUpload,
  RHFSwitch,
} from 'src/components/hook-form';
import { RouterLink } from 'src/routes/components';
import { GET_ALL_EVENTS, GET_EVENT, UPSERT_EVENT } from 'src/api/event';
import { GET_VENUE_LIST } from 'src/api/venues';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { GET_ALL_ASSIGNMENT, REMOVE_ASSIGNMENT } from 'src/api/assignment';
import { TableConfig } from 'src/components/table/table-config';
import GQLTable from 'src/components/table/gql/table';
import { useAuthContext } from 'src/auth/hooks';
import Markdown from 'src/components/markdown';
import { client } from 'src/utils/apollo';
import { useLotteryCounterOptions } from 'src/hooks/use-lottery-counter-options';

// ----------------------------------------------------------------------

type Props = {
  currentEvent?: Event;
};

const eventStatusNames = {
  [EventStatus.Complete]: 'Complete',
  [EventStatus.Removed]: 'Removed',
  [EventStatus.Draft]: 'Draft',
  [EventStatus.ReadyForLottery]: 'Lottery',
  [EventStatus.FirstComeFirstServe]: 'First come first serve',
}

dayjs.extend(utc);
dayjs.extend(timezone);

export default function EditEvent({ currentEvent }: Props) {
  const router = useRouter();
  const { user } = useAuthContext();
  const { options: lotteryCounterOptions } = useLotteryCounterOptions({
    org: user.member.org!,
    countValue: currentEvent?.lotteryCounter as LotteryCounter,
    dateLimit: currentEvent?.endTime || undefined,
  });
  const allDisabled = useMemo(() => [EventStatus.Complete, EventStatus.Removed].includes(currentEvent?.status || '' as any), [currentEvent?.status]);
  const { data: venueRes } = useQuery(GET_VENUE_LIST, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        status: VenueStatus.Active,
      },
    },
  });
  const [removeAssignment, { loading: removeAssignmentLoading }] = useMutation(REMOVE_ASSIGNMENT, {
    refetchQueries: [GET_ALL_EVENTS, {
      query: GET_EVENT,
      variables: {
        id: currentEvent?.id,
      },
    }],
  });
  const [upsertEvent, { loading: upsertEventLoading }] = useMutation(UPSERT_EVENT);

  const venues = useMemo(() => venueRes?.venues?.items || [], [venueRes]);
  const mdUp = useResponsive('up', 'md');

  const [removeAssignmentId, setRemoveAssignmentId] = useState<string | null>();
  const deleteConfirm = useBoolean();
  const { enqueueSnackbar } = useSnackbar();

  const NewEventSchema = Yup.object().shape({
    id: Yup.string(),
    name: Yup.string().required('Name is required'),
    status: Yup.string(),
    notes: Yup.string(),
    attachments: Yup.array(),
    notifyWhenFullyStaffed: Yup.boolean(),
    lotteryNumber: Yup.number().nullable(),
    venueId: Yup.string().required('Venue is required'),
    scheduledFirstComeFirstServe: Yup.string(),
    createdById: Yup.string(),
    assignments: Yup.array(),
  });

  const defaultValues = useMemo(
    () => ({
      id: currentEvent?.id,
      name: currentEvent?.name || '',
      status: currentEvent?.status || EventStatus.Draft,
      notes: currentEvent?.notes || '',
      attachments: [],
      venueId: currentEvent?.venueId || '',
      lotteryNumber: currentEvent?.lotteryNumber,
      notifyWhenFullyStaffed: currentEvent?.notifyWhenFullyStaffed || false,
      scheduledFirstComeFirstServe: currentEvent?.scheduledFirstComeFirstServe || '',
      assignments: currentEvent?.assignments || [],
      createdById: currentEvent?.createdById || user?.id,
    }),
    [currentEvent, user]
  );

  const methods = useForm({
    resolver: yupResolver(NewEventSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    getValues,
    setValue,
    watch,
    formState: { isSubmitting, isValid },
  } = methods;

  const values = watch();

  useEffect(() => {
    if(!values.lotteryNumber) {
      setValue('lotteryNumber', lotteryCounterOptions[0]?.counter);
    }
  }, [lotteryCounterOptions, values.status, values.lotteryNumber, setValue]);

  useEffect(() => {
    const loadImage = async (url: string, index: number) => {
      const res = await fetch(url);
      const blob = await res.blob();
      const fileName = url || 'file';
      const file = new File([blob], fileName);
      return Object.assign(file, {
        preview: URL.createObjectURL(file),
        existing: true,
        attachmentPath: currentEvent?.attachmentPaths?.[index],
      });
    };

    const loadAll = async () => {
      if (currentEvent && currentEvent.attachments) {
        const allImages = await Promise.all(currentEvent.attachments.map(loadImage));
        setValue('attachments', allImages);
      }
    }
    loadAll();
  }, [currentEvent, setValue]);

  const selectedVenue: Venue | undefined = useMemo(() => venues.find(({ id }: Venue) => values?.venueId === id), [venues, values?.venueId]);

  useEffect(() => {
    if (currentEvent) {
      reset(defaultValues);
    }
  }, [currentEvent, defaultValues, reset]);

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const files: any[] = values.attachments || [];

      const newFiles: any[] = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('attachments', [...files, ...newFiles] as any[], { shouldValidate: true });
    },
    [setValue, values.attachments]
  );

  const handleRemoveFile = useCallback(
    (inputFile: File | string) => {
      const filtered = values.attachments && values.attachments?.filter((file: any) => file !== inputFile);
      setValue('attachments', filtered);
    },
    [setValue, values.attachments]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('attachments', [] as any[]);
  }, [setValue]);

  const formSubmit = useCallback(async (formData: any, shouldReroute = true) => {
    try {
      let imageUploadUrls = [];
      const existingAttachments = formData.attachments
        .filter(({ existing, attachmentPath }: any) => existing && attachmentPath);
      const getUploadUrls = formData.attachments.filter(({ existing }: any) => !existing);
      if (getUploadUrls.length > 0) {
        let mutation: any = 'mutation {';
        getUploadUrls.forEach((file: any, index: number) => {
          mutation += `
            attachments${index}: eventAttachmentUploadUrl {
              attachmentPath
              uploadUrl
            }
          `;
        });
        mutation += '}';
        mutation = gql(mutation);
        const { data } = await client.mutate({
          mutation,
        });
        imageUploadUrls = Object.keys(data).map((key, index) => ({
          ...data[key],
          attachmentData: getUploadUrls[index],
        }));
      }

      const res = await upsertEvent({
        variables: {
          input: {
            id: formData?.id,
            name: formData?.name,
            notes: formData?.notes,
            status: formData?.status,
            notifyWhenFullyStaffed: formData?.notifyWhenFullyStaffed,
            scheduledFirstComeFirstServe: formData?.scheduledFirstComeFirstServe,
            lotteryNumber: formData?.lotteryNumber,
            attachmentPaths: [
              ...existingAttachments,
              ...imageUploadUrls,
            ].map(({ attachmentPath }) => attachmentPath),
            venueId: formData?.venueId,
            createdById: formData?.createdById,
            assignmentIds: formData?.assignments?.map(
              (assignment: any) => assignment.id
            ),
          },
        },
      });

      if (imageUploadUrls.length > 0) {
        await Promise.allSettled(
          imageUploadUrls.map(({
            uploadUrl,
            attachmentData,
          }: any) => fetch(uploadUrl, {
            method: 'PUT',
            body: attachmentData,
            headers: {
              'Content-Type': attachmentData.type,
            },
          }))
        );
      }

      await client.refetchQueries({
        include: [GET_ALL_EVENTS, GET_EVENT]
      });

      if (shouldReroute) {
        enqueueSnackbar(currentEvent ? 'Update success!' : 'Create success!');
        if (!currentEvent) {
          router.push(paths.dashboard.admin.overtime.eventDetail.replace(':eventId', res.data?.event?.id));
        }
      }
      return res.data?.event.id;
    } catch (error) {
      console.error(error);
      return '';
    }
  }, [upsertEvent, enqueueSnackbar, router, currentEvent]);

  const openRemoveAssignment = useCallback((assignmentId: string) => {
    setRemoveAssignmentId(assignmentId);
    deleteConfirm.onTrue();
  }, [deleteConfirm, setRemoveAssignmentId]);
  const handleRemoveAssignment = useCallback(async () => {
    await removeAssignment({
      variables: {
        id: removeAssignmentId,
      },
    });
    setRemoveAssignmentId(null);
    deleteConfirm.onFalse();
  }, [removeAssignment, setRemoveAssignmentId, removeAssignmentId, deleteConfirm]);

  const onSubmit = handleSubmit(async (formData) => {
    await formSubmit(formData);
  });

  const config: TableConfig<Assignment> = useMemo(() => ({
    header: {
      title: 'Assignments',
      button: {
        text: 'Add Assignment',
        icon: 'ic:baseline-add',
        loading: upsertEventLoading,
        disabled: !currentEvent?.id && !isValid,
        onClick: async () => {
          let eventId = currentEvent?.id;
          if (!eventId) {
            eventId = await formSubmit(getValues(), false);
            enqueueSnackbar('Created Event!');
          }
          router.push(
            paths.dashboard.admin.overtime.eventAssignmentDetail
            .replace(':eventId', eventId!)
            .replace(':assignmentId', 'new')
          );
        }
      }
    },
    table: {
      sx: {
        minWidth: 'inherit',
      }
    },
    search: {
      data: (currentEvent?.assignments || []) as any,
      query: GET_ALL_ASSIGNMENT,
      processResult: (data: any) => ({
        total: data.length,
        items: data.map((assignment: Assignment) => {
          const { shifts, ...rest } = assignment;
          const startTime = (shifts || []).filter(Boolean).reduce((curr: Date | null, shift) => {
            const start = new Date(shift!.startTime);
            if (!curr || isBefore(start, curr)) {
              return start;
            }
            return curr;
          }, null);
          const endTime = (shifts || []).filter(Boolean).reduce((curr: Date | null, shift) => {
            const end = new Date(shift!.endTime);
            if (!curr || isAfter(end, curr)) {
              return end;
            }
            return curr;
          }, null);
          return {
            ...rest,
            startTime,
            endTime,
            shifts,
          };
        }),
      }),
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Assignment) => {
          router.push(
            paths.dashboard.admin.overtime.eventAssignmentDetail
              .replace(':eventId', currentEvent?.id || '')
              .replace(':assignmentId', row.id)
          );
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (row: Assignment) => {
          openRemoveAssignment(row.id)
        },
      }
    ],
    columns: [
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        width: '30%',
        getHref: (row: Assignment) =>
          paths.dashboard.admin.overtime.eventAssignmentDetail
            .replace(':eventId', currentEvent?.id || '')
            .replace(':assignmentId', row.id),
      },
      {
        id: 'ranks',
        label: 'Ranks',
        emptyArrayLabel: 'None',
        width: '15%',
        noSort: true,
        columnType: 'array',
        maxRender: 1
      },
      {
        id: 'requiredSkills',
        label: 'Skills',
        width: '15%',
        noSort: true,
        columnType: 'array',
        maxRender: 1
      },
      {
        id: 'startTime',
        label: 'Start',
        columnType: 'date',
        width: '10%',
      },
      {
        id: 'endTime',
        label: 'End',
        columnType: 'date',
        width: '10%',
      },
      {
        id: 'shifts',
        width: '15%',
        label: 'Open Shifts',
        // TODO: Add calculation to backend resolvers
        columnType: 'string',
        renderValue: (shifts: Shift[]) => {
          const openShifts = (shifts || []).filter(Boolean).reduce((sum, shift) => {
            if (!shift!.userId) {
              sum += 1;
            }
            return sum;
          }, 0);
          return openShifts;
        },
      },
      { id: '', width: '5%', columnType: 'action', label: '' },
    ],
    filters: []
  }), [
    formSubmit,
    getValues,
    openRemoveAssignment,
    enqueueSnackbar,
    currentEvent?.assignments,
    currentEvent?.id,
    isValid,
    router,
    upsertEventLoading,
  ]);

  const currentFormValues = getValues();

  const renderDetails = (
    <>
      {mdUp && (
        <Grid md={2}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Name, notes, and venue
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={10}>
        <Card>
          {!mdUp && <CardHeader title="Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField
              name="name"
              label="Name"
              disabled={allDisabled}
              helperText={`Ref #: ${currentEvent?.referenceId || ''}`}
            />
            <RHFSelect
              name="venueId"
              label="Venue"
              disabled={allDisabled}
            >
              {venues.map((option: any) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))}
            </RHFSelect>

            {selectedVenue && (
              <Box sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5}>
                  <Typography variant="subtitle2">Address: </Typography>
                  <Typography variant="subtitle2">{ selectedVenue?.address }</Typography>
                  <Typography variant="subtitle2">{ `${selectedVenue?.city},` }</Typography>
                  <Typography variant="subtitle2">{ selectedVenue?.state }</Typography>
                  <Typography variant="subtitle2">{ selectedVenue?.zip }</Typography>
                </Stack>
                <Markdown children={selectedVenue?.notes || ''} />
              </Box>
            )}

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Notes</Typography>
              <RHFEditor simple name="notes" />
            </Stack>

            {/* TODO: Implement attachments */}
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Attachments</Typography>
              <RHFUpload
                multiple
                thumbnail
                disabled={allDisabled}
                name="attachments"
                maxSize={3145728}
                onDrop={handleDrop}
                onRemove={handleRemoveFile}
                onRemoveAll={handleRemoveAllFiles}
              />
            </Stack>

            {
              currentEvent &&
              <>
                <RHFSelect
                  fullWidth
                  name="status"
                  label="Posting type"
                  disabled={allDisabled}
                  InputLabelProps={{ shrink: true }}
                  PaperPropsSx={{ textTransform: 'capitalize' }}
                >
                  {[
                    EventStatus.Draft,
                    EventStatus.ReadyForLottery,
                    EventStatus.FirstComeFirstServe,
                    EventStatus.Complete,
                    EventStatus.Removed,
                  ].map((option) => (
                    <MenuItem disabled={[EventStatus.Complete, EventStatus.Removed].includes(option)} key={option} value={option}>
                      {(eventStatusNames as any)[option]}
                    </MenuItem>
                  ))}
                </RHFSelect>

                {currentFormValues && currentFormValues.status === EventStatus.FirstComeFirstServe && (
                  <DateTimePicker
                    label="First come first serve start time"
                    ampm={false}
                    timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                    timezone={user.member.org?.timezone}
                    value={currentFormValues?.scheduledFirstComeFirstServe ? dayjs(new Date(currentFormValues?.scheduledFirstComeFirstServe)) : dayjs(new Date())}
                    onChange={(date) => {
                      setValue('scheduledFirstComeFirstServe', date ? dayjs(date).toISOString() : '')
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        margin: 'normal',
                      },
                    }}
                  />
                )}

                {currentFormValues && currentFormValues.status === EventStatus.ReadyForLottery && (
                  <RHFSelect
                    fullWidth
                    name="lotteryNumber"
                    label="Lottery Date"
                    InputLabelProps={{ shrink: true }}
                    PaperPropsSx={{ textTransform: 'capitalize' }}
                    helperText={`FCFS: ${lotteryCounterOptions
                      .find(({ counter }) => counter === values?.lotteryNumber)
                      ?.endDate.add(user?.member?.org?.settings?.lottery?.fcfsShiftsDelay || 1, 'hours')?.format('ddd DD MMM YYYY HH:mm')
                    }`}
                  >
                    {lotteryCounterOptions.map((option) => (
                      <MenuItem key={option.counter} value={option.counter}>
                        {option.time}
                      </MenuItem>
                    ))}
                  </RHFSelect>
                )}

                <Stack>
                  <Stack direction="row" spacing={1.5}>
                    <DateTimePicker
                      label="Start time"
                      timezone={user.member.org?.timezone}
                      ampm={false}
                      timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                      value={currentEvent?.startTime ? dayjs(new Date(currentEvent.startTime)) : null}
                      disabled
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: 'normal',
                        },
                      }}
                    />
                    <DateTimePicker
                      label="End time"
                      ampm={false}
                      timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                      timezone={user.member.org?.timezone}
                      value={currentEvent?.endTime ? dayjs(new Date(currentEvent.endTime)) : null}
                      disabled
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: 'normal',
                        },
                      }}
                    />
                  </Stack>
                  <Typography color="grey" variant="subtitle2">The start and end time are calculated based on the open shifts.</Typography>
                </Stack>
              </>
            }

            <RHFSwitch disabled={allDisabled} name="notifyWhenFullyStaffed" label="Notify when fully staffed" />
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderAssignments = (
    <>
      {mdUp && (
        <Grid md={2}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Assignments
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            All assignments for this event
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={10}>
        <Card>
          {!mdUp && <CardHeader title="Assignments" />}

          <GQLTable config={config} />
        </Card>
      </Grid>
    </>
  );

  const renderActions = (
    <>
      {mdUp && <Grid md={4} />}
      <Grid xs={12} md={8} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Button
          component={RouterLink}
          variant='outlined'
          size="large"
          href={paths.dashboard.admin.overtime.events}
        >Cancel</Button>
        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          disabled={allDisabled}
          sx={{ ml: 2 }}
        >
          {!currentEvent ? 'Create Event' : 'Save Changes'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {renderDetails}

        {renderAssignments}

        {renderActions}

        <ConfirmDialog
          open={deleteConfirm.value}
          onClose={deleteConfirm.onFalse}
          title="Delete"
          content="Are you sure want to delete?"
          action={
            <LoadingButton loading={removeAssignmentLoading} variant="contained" color="error" onClick={handleRemoveAssignment}>
              Delete
            </LoadingButton>
          }
        />
      </Grid>
    </FormProvider>
  );
}
