import { useMemo, useEffect } from 'react';
import * as Yup from 'yup';
import { useMutation, useQuery } from '@apollo/client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// types
import { Notification, NotificationFrequency, Rank } from 'src/__generated__/resolvers-types';
// components
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFEditor,
  RHFTextField,
  RHFAutocomplete,
  RHFRadioGroup,
  RHFSwitch,
} from 'src/components/hook-form';
import { GET_RANKS } from 'src/api/rank';
import { GET_ALL_NOTIFICATIONS, UPSERT_NOTIFICATION } from 'src/api/notification';
import { RouterLink } from 'src/routes/components';

// ----------------------------------------------------------------------

type Props = {
  currentNotification?: Notification ;
};

export default function EditNotification({ currentNotification }: Props) {
  const router = useRouter();

  const [upsertNotification] = useMutation(UPSERT_NOTIFICATION, {
    refetchQueries: [GET_ALL_NOTIFICATIONS],
  });

  const { data: rankResponse } = useQuery(GET_RANKS, {
    variables: {
      input: {
        limit: 1000,
      }
    }
  });
  const { ranks: { items: ranks } } = rankResponse || { ranks: { items: [] } };

  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const NewNotificationSchema = Yup.object().shape({
    id: Yup.string(),
    title: Yup.string().required('Title is required'),
    body: Yup.string().required('Body is required'),
    active: Yup.boolean().required('Active is required'),
    frequency: Yup.string().required('Frequency is required'),
    ranks: Yup.array(),
  });

  const defaultValues = useMemo(
    () => ({
      id: currentNotification?.id,
      title: currentNotification?.title || '',
      body: currentNotification?.body || '',
      active: currentNotification ? currentNotification.active : true,
      frequency: currentNotification?.frequency || NotificationFrequency.Once,
      ranks: currentNotification?.ranks || [],
    }),
    [currentNotification]
  );

  const methods = useForm({
    resolver: yupResolver(NewNotificationSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (currentNotification) {
      reset(defaultValues);
    }
  }, [currentNotification, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await upsertNotification({
        variables: {
          input: {
            id: data.id,
            title: data.title,
            body: data.body,
            active: data.active,
            frequency: data.frequency,
            rankIds: (data.ranks || []).map((rank: Rank) => rank.id),
          },
        },
      });
      reset();
      enqueueSnackbar(currentNotification ? 'Update success!' : 'Create success!');
      router.push(paths.dashboard.admin.settings.notifications);
    } catch (error) {
      console.error(error);
    }
  });

  const renderDetails = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Title, body, active...
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField name="title" label="Title" />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Content</Typography>
              <RHFEditor simple name="body" />
            </Stack>

            <RHFSwitch name="active" label="Active" />
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderProperties = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Visibility Preferences
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Who sees the notification and at what time...
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Properties" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFRadioGroup
              row
              name="frequency"
              label="Notification Frequency"
              spacing={4}
              options={[
                { value: NotificationFrequency.Once, label: 'Once' },
                { value: NotificationFrequency.Always, label: 'Always' },
                { value: NotificationFrequency.UntilExpire, label: 'Until Expiration' },
              ]}
            />

            <RHFAutocomplete
              name="ranks"
              label="Ranks"
              placeholder="+ Ranks"
              multiple
              options={ranks.map((option: Rank) => option)}
              getOptionLabel={(option: any) => option.name}
              renderOption={(props, option: Rank) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
              renderTags={(selected, getTagProps) =>
                selected.map((option: Rank, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    size="small"
                    color="info"
                    variant="soft"
                  />
                ))
              }
            />
          </Stack>
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
          href={paths.dashboard.admin.settings.notifications}
        >Cancel</Button>
        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          sx={{ ml: 2 }}
        >
          {!currentNotification ? 'Create Notification' : 'Save Changes'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {renderDetails}

        {renderProperties}

        {renderActions}
      </Grid>
    </FormProvider>
  );
}
