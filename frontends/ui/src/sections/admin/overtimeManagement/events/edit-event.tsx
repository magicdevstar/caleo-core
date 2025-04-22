import { useMemo, useEffect, useCallback, useState } from 'react';
import { useDebounce } from "react-use";
import * as Yup from 'yup';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { gql, useMutation, useQuery } from '@apollo/client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
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
import CircularProgress from '@mui/material/CircularProgress';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
import { useBoolean } from 'src/hooks/use-boolean';
import { useAuthContext } from 'src/auth/hooks';
import { useLotteryCounterOptions } from 'src/hooks/use-lottery-counter-options';
import { convertDate, dateTimeFormat } from 'src/hooks/use-datejs';
import useDebounceText from 'src/hooks/use-debounce-text';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';
// types
import {
  Event,
  EventStatus,
  Venue,
  VenueStatus,
  MemberStatus,
} from 'src/__generated__/resolvers-types';
import { APPROVE_EVENT, GET_ALL_EVENTS, GET_EVENT, REJECT_EVENT, UPSERT_EVENT } from 'src/api/event';
import { GET_USERS_SLIM } from 'src/api/user';
import { GET_VENUE_LIST } from 'src/api/venues';
// components
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFEditor,
  RHFTextField,
  RHFSelect,
  RHFUpload,
  RHFSwitch,
  RHFAutocomplete,
} from 'src/components/hook-form';
import { ConfirmDialog } from 'src/components/custom-dialog';
import Markdown from 'src/components/markdown';
import Iconify from 'src/components/iconify';
import { client } from 'src/utils/apollo';
import { useFeatures } from 'src/hooks/use-features';
import EventAssignmentsTable from './event-assignments-table';

// ----------------------------------------------------------------------

type Props = {
  currentEvent?: Event;
  eventTemplateView?: boolean;
};

const eventStatusNames = {
  [EventStatus.Complete]: 'Complete',
  [EventStatus.Removed]: 'Removed',
  [EventStatus.Draft]: 'Draft',
  [EventStatus.ReadyForLottery]: 'Lottery',
  [EventStatus.InterestList]: 'Interest List',
  [EventStatus.FirstComeFirstServe]: 'First come first serve',
  [EventStatus.Requested]: 'Requested',
}

const NewEventSchema = Yup.object().shape({
  id: Yup.string(),
  name: Yup.string().required('Name is required'),
  status: Yup.string(),
  notes: Yup.string(),
  attachments: Yup.array(),
  notifyWhenFullyStaffed: Yup.boolean(),
  lotteryNumber: Yup.number().nullable(),
  venueId: Yup.mixed<Venue | string>()
    .nullable()
    .transform((value: Venue) => value?.id)
    .test('venue-required', 'Venue is Required', (value) => !!value),
  scheduledFirstComeFirstServe: Yup.string(),
  scheduledInterestList: Yup.string(),
  autoAssignInterestList: Yup.boolean().nullable(),
  scheduledCloseInterestList: Yup.string(),
  createdById: Yup.string(),
  assignments: Yup.array(),
  notifyOnFirstComeFirstServe: Yup.boolean(),
  outsideOrgCode: Yup.string().nullable(),
  overtimeReasonCode: Yup.string().nullable(),
  budgetActivityCode: Yup.string().nullable(),
  supervisor: Yup.object().nullable(),
  lieutenant: Yup.object().nullable(),
  interestListAutoAssignCutoff: Yup.string().nullable(),
  ocn: Yup
    .string()
    .nullable()
    .notRequired()
    .when('ocn', {
        is: (value: string) => value?.length,
        then: (rule) => rule.test('len', 'Must be exactly 10 characters', (val) => (val || '').length === 10),
    }),
}, [['ocn', 'ocn']]);

dayjs.extend(utc);
dayjs.extend(timezone);

export default function EditEvent({
  currentEvent,
  eventTemplateView
}: Props) {
  const basePath = eventTemplateView ? paths.dashboard.admin.overtime.templates : paths.dashboard.admin.overtime
  const router = useRouter();
  const { user } = useAuthContext();
  const {
    venueContractDates,
    interestLists,
    lottery,
    externalEventRequests,
    lasdEventFields,
  } = useFeatures();
  const [userSearch, setUserSearch] = useState('');
  const [queryText, setQueryText] = useState('');

  useDebounce(() => {
    setQueryText(userSearch);
  }, 500, [userSearch, setQueryText]);

  const eventStatuses = useMemo(() => {
    const statuses = [
      EventStatus.Draft,
    ];
    if (
      lottery &&
      user.member.org?.settings?.lottery?.enabled
    ) {
      statuses.push(EventStatus.ReadyForLottery);
    }
    if (interestLists) {
      statuses.push(EventStatus.InterestList);
    }
    if (externalEventRequests) {
      statuses.push(EventStatus.Requested);
    }
    return [
      ...statuses,
      EventStatus.FirstComeFirstServe,
      EventStatus.Complete,
      EventStatus.Removed,
    ];
  }, [user, lottery, interestLists, externalEventRequests]);

  const { options: lotteryCounterOptions } = useLotteryCounterOptions({
    org: user.member.org!,
    countValue: currentEvent?.lotteryCounter,
    dateLimit: currentEvent?.endTime || undefined,
  });

  const allDisabled = useMemo(() => {
    const hasInvalidStatus = [EventStatus.Removed, EventStatus.Requested].includes(currentEvent?.status || '' as any);
    const isRemoved = currentEvent?.removedAt;
    return Boolean(hasInvalidStatus || isRemoved);
  }, [currentEvent?.status, currentEvent?.removedAt]);

  const isComplete = useMemo(() => {
    if (eventTemplateView) return false;
    const completeStatus = currentEvent?.status === EventStatus.Complete;
    const completeEndTime = currentEvent?.endTime ? Date.now() >= new Date(currentEvent.endTime).valueOf() : false;
    return completeStatus || completeEndTime;
  }, [
    eventTemplateView,
    currentEvent?.endTime,
    currentEvent?.status
  ]);

  const disabledStatus = useMemo(() =>
    currentEvent?.assignments?.some?.((assignment) => (assignment?.shiftSlots?.length || 0) > 0),
  [currentEvent?.assignments]);

  const { setText: setVenueSearchText, debouncedText: venueSearch } = useDebounceText({ ms: 500 });

  const { data: usersData, loading: loadingUser } = useQuery(GET_USERS_SLIM, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        query: queryText,
        limit: 10,
        statuses: [MemberStatus.Active],
      }
    },
  });
  const users = usersData?.users?.items || [];

  const { data: venueRes, loading: venuesLoading } = useQuery(GET_VENUE_LIST, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        limit: 10,
        orderBy: 'name',
        order: 'asc',
        status: VenueStatus.Active,
        query: venueSearch || undefined,
      },
    },
  });
  const [approveEvent, { loading: approveEventLoading }] = useMutation(APPROVE_EVENT, {
    refetchQueries: [GET_ALL_EVENTS, {
      query: GET_EVENT,
      variables: {
        id: currentEvent?.id,
      },
    }],
  });
  const [rejectEvent, { loading: rejectEventLoading }] = useMutation(REJECT_EVENT, {
    refetchQueries: [GET_ALL_EVENTS, {
      query: GET_EVENT,
    }],
  });
  const [upsertEvent, { loading: upsertEventLoading }] = useMutation(UPSERT_EVENT);

  const venues = useMemo(() => venueRes?.venues?.items || [], [venueRes]);
  const mdUp = useResponsive('up', 'md');

  const rejectEventConfirm = useBoolean();
  const showAttachments = useBoolean(false);
  const [rejectEventNote, setRejectEventNote] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const submitEventRejection = useCallback(async () => {
    try {
      if (!rejectEventNote || !currentEvent?.id) {
        return;
      }
      await rejectEvent({
        variables: {
          id: currentEvent?.id,
          reason: rejectEventNote,
        },
      });
      router.push('/dashboard/admin/overtime/events');
    } catch(error) {
      enqueueSnackbar('Failed to reject event', { variant: 'error', autoHideDuration: 5000 });
    }
  }, [
    router,
    currentEvent,
    rejectEventNote,
    rejectEvent,
    enqueueSnackbar,
  ]);

  const defaultValues = useMemo(
    () => ({
      id: currentEvent?.id,
      name: currentEvent?.name || '',
      status: eventTemplateView ? EventStatus.Template : (currentEvent?.status || EventStatus.Draft),
      notes: currentEvent?.notes || '',
      attachments: [],
      ocn: currentEvent?.ocn || '',
      venueId: currentEvent?.venue || null,
      lotteryNumber: currentEvent?.lotteryNumber,
      notifyOnFirstComeFirstServe: currentEvent?.notifyOnFirstComeFirstServe || false,
      notifyWhenFullyStaffed: currentEvent?.notifyWhenFullyStaffed || false,
      autoAssignInterestList: currentEvent?.autoAssignInterestList || true,
      scheduledFirstComeFirstServe: currentEvent?.scheduledFirstComeFirstServe || '',
      scheduledInterestList: currentEvent?.scheduledInterestList || '',
      scheduledCloseInterestList: currentEvent?.scheduledCloseInterestList || '',
      interestListAutoAssignCutoff: currentEvent?.interestListAutoAssignCutoff || '',
      assignments: currentEvent?.assignments || [],
      createdById: currentEvent?.createdById || user?.id,
      outsideOrgCode: currentEvent?.outsideOrgCode,
      overtimeReasonCode: currentEvent?.overtimeReasonCode,
      budgetActivityCode: currentEvent?.budgetActivityCode,
      supervisor: currentEvent?.supervisor || null,
      lieutenant: currentEvent?.lieutenant || null,
    }),
    [
      currentEvent,
      user,
      eventTemplateView
    ]
  );

  const methods = useForm({
    resolver: yupResolver(NewEventSchema),
    mode: 'onChange',
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    getValues,
    setValue,
    watch,
    trigger,
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

  // venueId is initially a venue object until it is transformed after form submit through schema
  const selectedVenue = values.venueId as Venue | null;

  const showVenueContractWarning = useMemo(() => {
    if (!venueContractDates) {
      return false;
    }
    const convertedDate = convertDate({ date: new Date(selectedVenue?.contract?.expirationDate || 0), user });
    if (!selectedVenue?.contract?.expirationDate || convertedDate.isBefore(dayjs())) {
      return true;
    }
    return false;
  }, [venueContractDates, selectedVenue, user]);

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
            ocn: formData?.ocn,
            notifyWhenFullyStaffed: formData?.notifyWhenFullyStaffed,
            autoAssignInterestList: formData?.autoAssignInterestList,
            scheduledFirstComeFirstServe: formData?.scheduledFirstComeFirstServe,
            scheduledInterestList: formData?.scheduledInterestList,
            scheduledCloseInterestList: formData?.scheduledCloseInterestList,
            interestListAutoAssignCutoff: formData?.interestListAutoAssignCutoff,
            notifyOnFirstComeFirstServe: formData?.notifyOnFirstComeFirstServe,
            lotteryNumber: formData?.lotteryNumber,
            attachmentPaths: [
              ...existingAttachments,
              ...imageUploadUrls,
            ].map(({ attachmentPath }) => attachmentPath),
            venueId: formData?.venueId,
            createdById: formData?.createdById,
            outsideOrgCode: formData?.outsideOrgCode,
            overtimeReasonCode: formData?.overtimeReasonCode,
            budgetActivityCode: formData?.budgetActivityCode,
            supervisorId: formData?.supervisor?.id,
            lieutenantId: formData?.lieutenant?.id,
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
          router.push(basePath.eventDetail.replace(':eventId', res.data?.event?.id));
        }
      }
      return res.data?.event.id;
    } catch (error) {
      enqueueSnackbar('Failed to save changes. Please try again.', { variant: 'error' });
      console.error(error);
      return '';
    }
  }, [upsertEvent, enqueueSnackbar, router, currentEvent, basePath]);

  const onSubmit = handleSubmit(async (formData: any) => {
    await formSubmit(formData);
  });

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

            {lasdEventFields && (
              <Stack>
                <Stack direction="row" spacing={1.5} paddingBottom={1.5}>
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
                <Stack direction="row" spacing={1.5} paddingBottom={1.5}>
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
                <Stack direction="row" spacing={1.5} paddingBottom={1.5}>
                  <RHFAutocomplete
                    name="supervisor"
                    label='Lieutenant'
                    sx={{ width: '100%' }}
                    placeholder="Lieutenant"
                    disabled={allDisabled}
                    loading={loadingUser}
                    textFieldChange={(event) => {
                      setUserSearch((event as any).target.value);
                    }}
                    helperText="Incident commander that oversees the event and will be included on all shift documents"
                    options={users}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(u: any) => u?.name}
                    renderOption={(props, option, { selected }) => (
                      <li {...props} key={option?.id}>
                        <Checkbox style={{ marginRight: 8 }} checked={selected} />
                        {option?.name}
                      </li>
                    )}
                    renderTags={(selected, getTagProps) =>
                      selected.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option?.id}
                          label={option?.name}
                          size="small"
                          color="info"
                          variant="soft"
                        />
                      ))

                    }
                  />
                  <RHFAutocomplete
                    name="lieutenant"
                    label='Signing Supervisor'
                    placeholder="Signing Supervisor"
                    disabled={allDisabled}
                    loading={loadingUser}
                    sx={{ width: '100%' }}
                    textFieldChange={(event) => {
                      setUserSearch((event as any).target.value);
                    }}
                    helperText="Supervisor that will sign off all shift confirmation documents."
                    options={users}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    getOptionLabel={(u: any) => u?.name}
                    renderOption={(props, option, { selected }) => (
                      <li {...props} key={option?.id}>
                        <Checkbox style={{ marginRight: 8 }} checked={selected} />
                        {option?.name}
                      </li>
                    )}
                    renderTags={(selected, getTagProps) =>
                      selected.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option?.id}
                          label={option?.name}
                          size="small"
                          color="info"
                          variant="soft"
                        />
                      ))
                    }
                  />
                </Stack>
              </Stack>
            )}

            <RHFAutocomplete
              openOnFocus
              name="venueId"
              label="Venue Name *"
              disabled={allDisabled}
              options={venues}
              filterOptions={(x: any) => x}
              loading={venuesLoading}
              helperText={currentEvent?.requestDetails?.estimatedAttendees ? `Estimated attendees: ${currentEvent?.requestDetails?.estimatedAttendees}` : ''}
              loadingText={
                <>
                  Loading...
                  <CircularProgress color="inherit" size={14} sx={{ ml: 1.5 }} />
                </>
              }
              getOptionLabel={(option) => (option as Venue).name}
              isOptionEqualToValue={(option: any, value: any) => option.id === value.id}
              onInputChange={(event, newInputValue) => {
                if (event) {
                  setVenueSearchText(newInputValue);
                }
              }}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
            />

            {selectedVenue && (
              <Box sx={{ mb: 1 }}>
                <Box sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.2)', borderRadius: 2 }}>
                  <Stack direction="row" spacing={1.5}>
                    <Typography variant="subtitle2">Address: </Typography>
                    <Typography variant="subtitle2">{ selectedVenue?.address }</Typography>
                    <Typography variant="subtitle2">{ `${selectedVenue?.city},` }</Typography>
                    <Typography variant="subtitle2">{ selectedVenue?.state }</Typography>
                    <Typography variant="subtitle2">{ selectedVenue?.zip }</Typography>
                  </Stack>
                  {currentEvent?.requestDetails?.estimatedAttendees && <Typography variant="subtitle2">Estimated Attendees: {currentEvent?.requestDetails?.estimatedAttendees}</Typography>}
                  {currentEvent?.requestDetails?.numberOfOfficers && <Typography variant="subtitle2">Requested number of officers: {currentEvent?.requestDetails?.numberOfOfficers}</Typography>}
                  <Markdown children={selectedVenue?.notes || ''} />
                  {showVenueContractWarning && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant='caption' color="grey">⚠️ Venue contract is is expired. Please update the contract or replace the venue.</Typography>
                      <Button sx={{ minWidth: '90px' }} component={RouterLink} href={`/dashboard/admin/overtime/venues/${(values?.venueId as any)?.id}`}>Edit venue</Button>
                    </Box>
                  )}
                </Box>
              </Box>
            )}

            {
              currentEvent && !eventTemplateView &&
              <>
                <Stack spacing={2} direction="row">
                  <RHFSelect
                    fullWidth
                    name="status"
                    label="Posting type"
                    disabled={allDisabled || isComplete || disabledStatus}
                    helperText={disabledStatus ? 'Cannot change status before all shifts have been assigned a time' : ''}
                    InputLabelProps={{ shrink: true }}
                    PaperPropsSx={{ textTransform: 'capitalize' }}
                  >
                    {eventStatuses.map((option) => (
                      <MenuItem disabled={[EventStatus.Complete, EventStatus.Removed].includes(option)} key={option} value={option}>
                        {(eventStatusNames as any)[option]}
                      </MenuItem>
                    ))}
                  </RHFSelect>
                  {
                    currentEvent.status === EventStatus.Requested && (
                      <>
                        <Button
                          sx={{ minWidth: '150px' }}
                          color="error"
                          variant="outlined"
                          onClick={rejectEventConfirm.onTrue as any}
                          startIcon={<Iconify icon="mdi:shield-remove" />}
                        >Reject</Button>
                        <LoadingButton
                          sx={{ minWidth: '150px' }}
                          color="primary"
                          variant="contained"
                          loading={approveEventLoading}
                          onClick={() => approveEvent({
                            variables: {
                              id: currentEvent?.id,
                            },
                          })}
                          startIcon={<Iconify icon="mdi:shield-check" />}
                        >Approve</LoadingButton>
                      </>
                    )
                  }
                </Stack>

                {currentFormValues && currentFormValues.status === EventStatus.FirstComeFirstServe && (
                  <Box>
                    <DateTimePicker
                      label="First come first serve start time"
                      ampm={false}
                      disabled={allDisabled || isComplete}
                      timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                      timezone={user.member.org?.timezone}
                      value={currentFormValues?.scheduledFirstComeFirstServe ? dayjs(new Date(currentFormValues?.scheduledFirstComeFirstServe)) : dayjs(new Date())}
                      onChange={(date) => {
                        setValue('scheduledFirstComeFirstServe', date ? dayjs(date).toISOString() : '')
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          margin: 'normal'
                        },
                      }}
                    />

                    <RHFSwitch disabled={allDisabled || isComplete} name="notifyOnFirstComeFirstServe" label="Notify when first come first serve is available" />
                  </Box>
                )}

                {currentFormValues && currentFormValues.status === EventStatus.InterestList && (
                  <>
                    <DateTimePicker
                      label="Interest list start time"
                      ampm={false}
                      disabled={allDisabled || isComplete}
                      timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                      timezone={user.member.org?.timezone}
                      value={
                        currentFormValues?.scheduledInterestList ?
                        dayjs(new Date(currentFormValues?.scheduledInterestList)) :
                        dayjs(new Date())
                      }
                      onChange={(date) => {
                        setValue('scheduledInterestList', date ? dayjs(date).toISOString() : '')
                      }}
                      slotProps={{
                        textField: {
                          helperText: 'Date officers are able to express interest in the shifts.',
                          fullWidth: true,
                          margin: 'normal',
                        },
                      }}
                    />
                    <RHFSwitch disabled={allDisabled || isComplete} name="autoAssignInterestList" label="Auto assign shifts" />
                    {
                      currentFormValues.autoAssignInterestList && (
                        <Stack direction="row" spacing={2} alignItems="center">
                          <DateTimePicker
                            label="Auto Hire Start Time"
                            ampm={false}
                            disabled={allDisabled || isComplete}
                            timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                            timezone={user.member.org?.timezone}
                            minDate={currentFormValues?.scheduledInterestList ? dayjs(new Date(currentFormValues?.scheduledInterestList)) : dayjs(new Date())}
                            value={
                              currentFormValues?.scheduledCloseInterestList ?
                              dayjs(new Date(currentFormValues?.scheduledCloseInterestList)) :
                              dayjs(
                                currentEvent?.startTime ? new Date(currentEvent.startTime) : new Date()
                              ).subtract(
                                user.member.org?.settings?.interestList?.defaultHoursBeforeShift || 24,
                                'hours'
                              )
                            }
                            onChange={(date) => {
                              setValue('scheduledCloseInterestList', date ? dayjs(date).toISOString() : '')
                            }}
                            slotProps={{
                              textField: {
                                helperText: 'Date the interest list automatically begins assigning shifts.',
                                fullWidth: true,
                                margin: 'normal',
                              },
                            }}
                          />
                          <Typography variant="body1">-</Typography>
                          <DateTimePicker
                            label="Auto Hire End Time"
                            ampm={false}
                            disabled={allDisabled || isComplete}
                            timeSteps={{ hours: 1, minutes: 15, seconds: 5 }}
                            timezone={user.member.org?.timezone}
                            value={
                              currentFormValues?.interestListAutoAssignCutoff ?
                                dayjs(new Date(currentFormValues?.interestListAutoAssignCutoff)) :
                                dayjs(
                                  currentEvent?.startTime ? new Date(currentEvent.startTime) : new Date()
                                ).subtract(
                                  user.member.org?.settings?.interestList?.defaultAutoHireCutoff || 7,
                                  'days'
                                )
                            }
                            onChange={(date) => {
                              setValue('interestListAutoAssignCutoff', date ? dayjs(date).toISOString() : '')
                            }}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                margin: 'normal',
                                helperText: 'Date the interest list stops assigning available shifts.'
                              },
                            }}
                          />
                        </Stack>
                      )
                    }
                  </>
                )}

                {currentFormValues && currentFormValues.status === EventStatus.ReadyForLottery && (
                  <RHFSelect
                    fullWidth
                    disabled={allDisabled || isComplete}
                    name="lotteryNumber"
                    label="Lottery Date"
                    InputLabelProps={{ shrink: true }}
                    PaperPropsSx={{ textTransform: 'capitalize' }}
                    helperText={`FCFS: ${lotteryCounterOptions
                      .find(({ counter }) => counter === values?.lotteryNumber)
                      ?.endDate.add(user?.member?.org?.settings?.lottery?.fcfsShiftsDelay || 1, 'hours')?.format(dateTimeFormat)
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
                          ...(currentEvent.requestDetails?.startTime ? {
                            helperText: `Suggested start time: ${convertDate({ date: currentEvent.requestDetails?.startTime, user }).format(dateTimeFormat)}`
                          } : {}),
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
                          ...(currentEvent.requestDetails?.endTime ? {
                            helperText: `Suggested end time: ${convertDate({ date: currentEvent.requestDetails?.endTime, user }).format(dateTimeFormat)}`
                          } : {}),
                        },
                      }}
                    />
                  </Stack>
                  <Typography color="grey" variant="subtitle2">The start and end time are calculated based on the open shifts.</Typography>
                </Stack>
              </>
            }

            { !eventTemplateView && (<RHFSwitch disabled={allDisabled || isComplete} name="notifyWhenFullyStaffed" label="Notify when fully staffed" />) }
          </Stack>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <Accordion
            disableGutters
            elevation={0}
            expanded={showAttachments.value}
            onChange={(_, expanded) => {
              showAttachments.setValue(expanded);
            }}
            sx={{
              p: 1,
              background: 'transparent',
              boxShadow: 'none !important',
              '&:before': {
                opacity: 0,
              }
            }}
          >
            <AccordionSummary
              sx={{
                '& .MuiAccordionSummary-content': {
                  justifyContent: 'center',
                  marginY: 0,
                }
              }}
            >
              <Typography variant="subtitle2">
                Notes and Attachments
              </Typography>
              <Iconify
                sx={{
                  mt: 0.2,
                  ml: 1,
                  transform: showAttachments.value ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 280ms'
                }}
                icon="mdi:chevron-down"
              />
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1.5} sx={{ mb: 4 }}>
                <Typography variant="subtitle2" sx={{ml: 0.5}}>Notes</Typography>
                <RHFEditor readOnly={allDisabled} simple name="notes" />
              </Stack>
              <Stack spacing={1.5}>
                <Typography variant="subtitle2" sx={{ml: 0.5}}>Attachments</Typography>
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
            </AccordionDetails>
          </Accordion>
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

          <EventAssignmentsTable
            currentEvent={currentEvent}
            eventTemplateView={eventTemplateView}
            basePath={basePath}
            allDisabled={allDisabled}
            isComplete={isComplete}
            isValid={isValid}
            onSaveEvent={async (shouldReroute = false) => {
              const validated = await trigger();
              if (validated) {
                const formattedValues = NewEventSchema.cast(getValues());
                return formSubmit(formattedValues, shouldReroute);
              }
              return '';
            }}
            upsertEventLoading={upsertEventLoading}
          />
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
          href={basePath.events}
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
          open={rejectEventConfirm.value}
          onClose={rejectEventConfirm.onFalse}
          title="Reject Event"
          content={(
            <>
              <Typography variant='body1' sx={{ mb: 1 }}>Are you sure want to reject this event?</Typography>
              <TextField
                label="Reason for rejection"
                multiline
                fullWidth
                sx={{ mt: 1 }}
                rows={4}
                onBlur={(event) => {
                  setRejectEventNote(event.target.value)
                }}
              />
            </>
          )}
          action={
            <LoadingButton
              loading={rejectEventLoading}
              variant="contained"
              color="error"
              onClick={submitEventRejection}
            >
              Reject Event
            </LoadingButton>
          }
        />
      </Grid>
    </FormProvider>
  );
}
