import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@apollo/client';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
// @mui
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LoadingButton from '@mui/lab/LoadingButton';
// Types
import { Event } from 'src/__generated__/resolvers-types';
// hooks
import useDebounceText from 'src/hooks/use-debounce-text';
// components
import FormProvider, { RHFAutocomplete } from 'src/components/hook-form';
import { GET_ALL_EVENTS_SLIM } from 'src/api/event';
import { useBillingByEvent } from 'src/hooks/use-billing-by-event';

const eventBillingByEventSchema = Yup.object().shape({
  event: Yup.mixed<Event | string>()
    .nullable()
    .transform((value: Event) => value?.id)
    .test('event-required', 'You must specify an Event', (value) => !!value),
});

export default function EventBillingByEvent() {
  const { downloadReport } = useBillingByEvent({ eventId: '' });

  const { text, setText, debouncedText } = useDebounceText({ ms: 500 });

  const inputFields = useMemo(() => {
    const trimmedValue = debouncedText.trim();
    let key = 'query';
    let value: string | number | undefined = trimmedValue === '' ? undefined : trimmedValue;
    try {
      const number = parseInt(value || '', 10);
      const isNum = /^\d{6}$/.test(value || '');
      if (isNum && !Number.isNaN(number)) {
        key = 'referenceIds';
        value = number;
      }
    } catch (error) {
      console.error('Not a number');
    }

    return {
      key,
      value,
    };
  }, [debouncedText]);

  const { data, loading: loadingEvents } = useQuery(GET_ALL_EVENTS_SLIM, {
    fetchPolicy: 'network-only',
    nextFetchPolicy: 'cache-first',
    variables: {
      input: {
        [inputFields.key]: inputFields.key === 'query' ? inputFields.value : [inputFields.value],
        limit: 10,
      },
    },
  });
  const options = useMemo(() => data?.events?.items || [], [data]);

  const defaultValues = useMemo(
    () =>
      ({
        event: null,
      }) as any,
    []
  );

  const methods = useForm({
    mode: 'onTouched',
    resolver: yupResolver(eventBillingByEventSchema),
    defaultValues,
  });

  const onSubmit = methods.handleSubmit(async (values) => {
    await downloadReport(values.event);
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
            sm: '1fr',
          }}
        >
          <RHFAutocomplete
            openOnFocus
            name="event"
            label="Event Name or Ref. #"
            options={options}
            inputValue={text || ''}
            filterOptions={(x: any) => x}
            loading={loadingEvents}
            loadingText={
              <>
                Loading...
                <CircularProgress color="inherit" size={14} sx={{ ml: 1.5 }} />
              </>
            }
            getOptionLabel={(option: any) => (option as Event).name}
            isOptionEqualToValue={(option: Event, v: Event) => option.id === v.id}
            onInputChange={(_event, newInputValue) => {
              setText(newInputValue);
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {`${option.name} (${option.referenceId})`}
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
