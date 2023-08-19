import { useMemo, useEffect, useCallback, useState } from 'react';
import * as Yup from 'yup';
import { useMutation, useQuery } from '@apollo/client';
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
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// types
import { Event } from 'src/__generated__/resolvers-types';
// components
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFEditor,
  RHFTextField,
  RHFSelect,
} from 'src/components/hook-form';
import { RouterLink } from 'src/routes/components';
import { GET_ALL_EVENTS, GET_EVENT, UPSERT_EVENT } from 'src/api/event';
import { GET_VENUE_LIST } from 'src/api/venues';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { REMOVE_ASSIGNMENT } from 'src/api/assignment';

// ----------------------------------------------------------------------

type Props = {
  currentEvent?: Event;
};

export default function EditEvent({ currentEvent }: Props) {
  const router = useRouter();
  const { data } = useQuery(GET_VENUE_LIST, {
    variables: {
      input: {
        limit: 1000,
      },
    },
  });
  const [removeAssignment] = useMutation(REMOVE_ASSIGNMENT, {
    refetchQueries: [GET_ALL_EVENTS, GET_EVENT],
  });
  const [upsertEvent] = useMutation(UPSERT_EVENT, {
    refetchQueries: [GET_ALL_EVENTS, GET_EVENT],
  });

  const venues = useMemo(() => data?.venues?.items || [], [data]);
  const mdUp = useResponsive('up', 'md');

  const [removeAssignmentId, setRemoveAssignmentId] = useState<string | null>();
  const deleteConfirm = useBoolean();
  const { enqueueSnackbar } = useSnackbar();

  const NewEventSchema = Yup.object().shape({
    id: Yup.string(),
    name: Yup.string().required('Name is required'),
    status: Yup.string(),
    notes: Yup.string(),
    attachment: Yup.string(),
    venueId: Yup.string().required('Venue is required'),
    assignments: Yup.array(),
  });

  const defaultValues = useMemo(
    () => ({
      id: currentEvent?.id,
      name: currentEvent?.name || '',
      status: currentEvent?.status || '',
      notes: currentEvent?.notes || '',
      attachment: currentEvent?.attachment || '',
      venueId: currentEvent?.venueId || '',
      assignments: currentEvent?.assignments || [],
    }),
    [currentEvent]
  );

  const methods = useForm({
    resolver: yupResolver(NewEventSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    getValues,
    formState: { isSubmitting, isValid },
  } = methods;

  useEffect(() => {
    if (currentEvent) {
      reset(defaultValues);
    }
  }, [currentEvent, defaultValues, reset]);


  const formSubmit = async (formData: any, shouldReroute = true) => {
    try {
      const res = await upsertEvent({
        variables: {
          input: {
            id: formData?.id,
            name: formData?.name,
            notes: formData?.notes,
            attachment: formData?.attachment,
            venueId: formData?.venueId,
            assignmentIds: formData?.assignments?.map(
              (assignment: any) => assignment.id
            ),
          },
        },
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
  };

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

  const renderDetails = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Name, notes, and venue
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField name="name" label="Name" />
            <RHFSelect
              name="venueId"
              label="Venue"
            >
              {venues.map((option: any) => (
                <MenuItem key={option.id} value={option.id}>
                  {option.name}
                </MenuItem>
              ))}
            </RHFSelect>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Notes</Typography>
              <RHFEditor simple name="notes" />
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderAssignments = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Assignments
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            All assignments for this event
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Assignments" />}

          <Stack spacing={3} sx={{ p: 3 }}>
          {(currentEvent?.assignments || []).length > 0 && (
              <Stack spacing={3} sx={{ p: 3 }}>
                {
                  (currentEvent?.assignments || []).map((assignment, index) => (
                    <>
                      <Stack spacing={1}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography color="text.primary">{ assignment.name }</Typography>
                          <Stack direction='row' spacing={1}>
                            <Button
                              component={RouterLink}
                              href={paths.dashboard.admin.overtime.eventAssignmentDetail
                                .replace(':eventId', currentEvent?.id || '')
                                .replace(':assignmentId', assignment.id)}
                              variant="outlined"
                              startIcon={<Iconify icon="ic:baseline-open-in-new" />}
                            >
                              Edit Assignment
                            </Button>
                            <IconButton onClick={() => openRemoveAssignment(assignment.id)}>
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          </Stack>
                        </Box>
                        <Stack direction='row' spacing={2}>
                          {/* TODO: Implement chips */}
                          <Chip color='info' label={(<Typography variant='caption'><span style={{fontWeight: 'bold'}}>Start: </span>N/A</Typography>)} />
                          <Chip color='info' label={(<Typography variant='caption'><span style={{fontWeight: 'bold'}}>End: </span>N/A</Typography>)} />
                          <Chip color='info' label={(<Typography variant='caption'><span style={{fontWeight: 'bold'}}>Open Shifts: </span>0</Typography>)} />
                        </Stack>
                      </Stack>
                      {index !== (currentEvent?.assignments?.length || 1) - 1 && <Divider />}
                    </>
                  ))
                }
              </Stack>
            )
          }
            <Button
              fullWidth
              variant="outlined"
              disabled={!currentEvent?.id && !isValid}
              startIcon={<Iconify icon="ic:baseline-add" />}
              onClick={async () => {
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
              }}
            >Add Assignment</Button>
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
          href={paths.dashboard.admin.overtime.events}
        >Cancel</Button>
        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
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
            <Button variant="contained" color="error" onClick={handleRemoveAssignment}>
              Delete
            </Button>
          }
        />
      </Grid>
    </FormProvider>
  );
}
