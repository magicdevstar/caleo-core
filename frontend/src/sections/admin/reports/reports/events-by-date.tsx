import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@apollo/client';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs from 'dayjs';
// @mui
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import { LoadingButton } from '@mui/lab';
// Types
import { EventStatus, User } from 'src/__generated__/resolvers-types';
import { GET_USERS } from 'src/api/user';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// components
import FormProvider, { RHFDatePicker, RHFAutocomplete } from 'src/components/hook-form';

const eventStatusOptions = [
  {
    label: 'Complete',
    value: EventStatus.Complete,
  },
  {
    label: 'Draft',
    value: EventStatus.Draft,
  },
  {
    label: 'First come first serve',
    value: EventStatus.FirstComeFirstServe,
  },
  {
    label: 'First come first serve scheduled',
    value: EventStatus.FirstComeFirstServeScheduled,
  },
  {
    label: 'Lottery',
    value: EventStatus.ReadyForLottery,
  },
  {
    label: 'Upcoming',
    value: EventStatus.Upcoming,
  },
];

const eventsByDateSchema = Yup.object().shape({
  dateRangeMin: Yup.date()
    .typeError('Invalid Date')
    .required('Minimum Date Range Required')
    .test('is-before-max', 'Date must be before Max Date', (min, context) =>
      context?.parent?.dateRangeMax ? min <= context?.parent?.dateRangeMax : true
    ),
  dateRangeMax: Yup.date()
    .typeError('Invalid Date')
    .required('Maximum Date Range Required')
    .test('is-before-max', 'Date must be after Min Date', (max, context) =>
      context?.parent?.dateRangeMin ? max >= context?.parent?.dateRangeMin : true
    ),
  eventStatus: Yup.array()
    .of(Yup.mixed<(typeof eventStatusOptions)[0] | string>())
    .transform((value: typeof eventStatusOptions) => value.map((v) => v.value)),
  createdBy: Yup.array()
    .of(Yup.mixed<User | string>())
    .transform((value: User[]) => value.map((v) => v.id)),
});

export default function EventsByDate() {
  const { user } = useAuthContext();
  const { data, loading: usersLoading } = useQuery(GET_USERS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    variables: {
      input: {
        // "admin": true,
        orderBy: 'createdAt',
        order: 'desc',
      },
    },
  });
  const users: User[] = useMemo(() => data?.users?.items || [], [data]);

  const methods = useForm({
    mode: 'onBlur',
    resolver: yupResolver(eventsByDateSchema),
    defaultValues: {
      dateRangeMin: undefined,
      dateRangeMax: undefined,
      eventStatus: [],
      createdBy: [],
    },
  });

  const dateRange = methods.watch(['dateRangeMin', 'dateRangeMax']);

  const onSubmit = methods.handleSubmit(async (values) => {
    console.log(values);
  });

  return (
    <Card
      sx={{
        p: 3,
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Search Criteria
        </Typography>
        <Box
          display="grid"
          rowGap={3}
          columnGap={2}
          sx={{
            mb: 4,
          }}
          gridTemplateColumns={{
            sm: 'repeat(1, 1fr)',
            md: 'repeat(2, 1fr)',
            xl: '1fr 1fr 25% 25%',
          }}
        >
          <RHFDatePicker
            name="dateRangeMin"
            label="Date Range: Min *"
            timezone={user?.member?.org?.timezone}
            maxDate={dateRange[1] && dayjs(dateRange[1])}
          />
          <RHFDatePicker
            name="dateRangeMax"
            label="Date Range: Max *"
            timezone={user?.member?.org?.timezone}
            minDate={dateRange[0] && dayjs(dateRange[0])}
          />
          <RHFAutocomplete
            multiple
            disableCloseOnSelect
            openOnFocus
            limitTags={1}
            name="eventStatus"
            label="Event Status"
            options={eventStatusOptions}
            isOptionEqualToValue={(option, value) => option.value === value.value}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.value}>
                <Checkbox style={{ marginRight: 8 }} checked={selected} />
                {option.label}
              </li>
            )}
          />
          <RHFAutocomplete
            multiple
            disableCloseOnSelect
            openOnFocus
            limitTags={1}
            name="createdBy"
            label="Created By"
            options={users}
            loading={usersLoading}
            getOptionLabel={(option) => (option as User).name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.id}>
                <Checkbox style={{ marginRight: 8 }} checked={selected} />
                {option.name}
              </li>
            )}
          />
        </Box>
        <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
          <LoadingButton type="submit" variant="contained" loading={methods.formState.isSubmitting}>
            Create Report
          </LoadingButton>
        </Stack>
      </FormProvider>
    </Card>
  );
}
