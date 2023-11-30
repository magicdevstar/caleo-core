import { useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { useForm } from 'react-hook-form';
import { useQuery } from '@apollo/client';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import LoadingButton from '@mui/lab/LoadingButton';
// Types
import {
  LotteryCounter,
  ShiftLotteryRequest,
  ShiftLotteryRequestStatus,
  User,
} from 'src/__generated__/resolvers-types';
import { GET_USERS } from 'src/api/user';
import { GET_SHIFT_LOTTERY_REQUESTS_REPORT } from 'src/api/shifts';
// hooks
import { useAuthContext } from 'src/auth/hooks';
// components
import FormProvider, { RHFAutocomplete } from 'src/components/hook-form';
import { client } from 'src/utils/apollo';
import { convertDate, dateFormat, dateTimeFormat, timeFormat } from 'src/hooks/use-datejs';
import { useDownloadCsv } from 'src/hooks/use-download-csv';
import { GET_LOTTERY_DATES } from 'src/api/lotteryCounter';

const shiftsByOfficerSchema = Yup.object().shape({
  officer: Yup.mixed<User | string>()
    .nullable()
    .transform((value: User) => value?.id)
    .test('officer-required', 'An Officer is required', (value) => !!value),
  lotteryCounters: Yup.array()
    .notRequired()
    .transform((item: { label: string; value: number }[]) => item.map((v) => v.value)),
});

export default function RankedShiftsByOfficer() {
  const { user } = useAuthContext();
  const { enqueueSnackbar } = useSnackbar();
  const { download } = useDownloadCsv({
    fileName: 'ranked-shifts-by-officer',
    ext: 'csv',
  });

  const { data: lotteryRunDates, loading: loadingLotteryRunDates } = useQuery(GET_LOTTERY_DATES, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    variables: {
      input: {
        orderBy: 'counter',
        order: 'desc',
        limit: 100,
      },
    },
  });

  const runDateOptions = (lotteryRunDates?.lotteryCounters?.items || []).map(
    (item: LotteryCounter) => ({
      label: `${convertDate({ date: item.start, user }).format(dateTimeFormat)} - ${convertDate({
        date: item.end,
        user,
      }).format(dateTimeFormat)}`,
      value: item.counter,
    })
  );

  const { data, loading: usersLoading } = useQuery(GET_USERS, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    variables: {
      input: {
        orderBy: 'createdAt',
        order: 'desc',
        limit: 100,
      },
    },
  });
  const users: User[] = useMemo(() => data?.users?.items || [], [data]);

  const defaultValues = useMemo(
    () =>
      ({
        officer: null,
        lotteryCounters: [],
      }) as any,
    []
  );

  const methods = useForm({
    mode: 'onTouched',
    resolver: yupResolver(shiftsByOfficerSchema),
    defaultValues,
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    try {
      const { data: res } = await client.query({
        query: GET_SHIFT_LOTTERY_REQUESTS_REPORT,
        variables: {
          input: {
            userId: values.officer,
            ...(values.lotteryCounters.length && { counters: values.lotteryCounters }),
            orderBy: 'createdAt',
            order: 'desc',
            includeRemoved: true,
          },
        },
      });
      const requests = res.shiftLotteryRequests.items;
      if (requests.length === 0) {
        enqueueSnackbar('No data. Please try a different set of filters.', {
          variant: 'info',
          autoHideDuration: 3000,
        });
        return;
      }
      const formattedJson = requests.map((request: ShiftLotteryRequest) => ({
        'Officer First Name': request.user?.firstName,
        'Officer Last Name': request.user?.lastName,
        'Officer P#': request.user?.member?.pNumber,
        'Lottery Date': convertDate({
          date: request.event?.lotteryCounter?.start || new Date(),
          user,
        }).format(dateFormat),
        'Event Ref. #': request?.event?.referenceId,
        'Event Name': request?.event?.name || '',
        'Assignment Name': request.assignment?.name,
        'Shift Start Date': request.shift?.startTime
          ? convertDate({ date: request.shift?.startTime, user }).format(dateFormat)
          : '',
        'Shift Start Time': request.shift?.startTime
          ? convertDate({ date: request.shift?.startTime, user }).format(timeFormat)
          : '',
        'Shift End Date': request.shift?.endTime
          ? convertDate({ date: request.shift?.endTime, user }).format(dateFormat)
          : '',
        'Shift End Time': request.shift?.endTime
          ? convertDate({ date: request.shift?.endTime, user }).format(timeFormat)
          : '',
        'Shift Request Ranked': (request.order || 0) + 1,
        'Shift Request Status':
          Object.keys(ShiftLotteryRequestStatus).find(
            (status) =>
              ShiftLotteryRequestStatus[status as keyof typeof ShiftLotteryRequestStatus] ===
              request.status
          ) || request.status,
      }));
      download(formattedJson);
    } catch (error) {
      enqueueSnackbar('Error creating report', { variant: 'error', autoHideDuration: 3000 });
      console.error(error);
    }
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
            md: '50% 1fr',
          }}
        >
          <RHFAutocomplete
            openOnFocus
            name="officer"
            label="Officer Name or P# *"
            options={users}
            loading={usersLoading}
            getOptionLabel={(option) => (option as User).name}
            filterOptions={(options, state) =>
              options.filter(
                (option: User) =>
                  option.name.toLowerCase().includes(state.inputValue.toLowerCase()) ||
                  option.member?.pNumber?.includes(state.inputValue)
              )
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.id}>
                {`${option.name} (#${option.member?.pNumber})`}
              </li>
            )}
          />
          <RHFAutocomplete
            multiple
            disableCloseOnSelect
            openOnFocus
            name="lotteryCounters"
            label="Lottery Date"
            limitTags={1}
            options={runDateOptions}
            loading={loadingLotteryRunDates}
            filterOptions={(options, state) =>
              options.filter((option: any) =>
                option.label.toLowerCase().includes(state.inputValue.toLowerCase())
              )
            }
            isOptionEqualToValue={(option: any, item: any) => option.value === item.value}
            renderOption={(props, option, { selected }) => (
              <li {...props} key={option.value}>
                <Checkbox style={{ marginRight: 8 }} checked={selected} />
                {option.label}
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
