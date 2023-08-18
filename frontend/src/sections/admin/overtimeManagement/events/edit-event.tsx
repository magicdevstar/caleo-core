import { useMemo, useEffect } from 'react';
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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
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
import { AssignmentList } from './edit/assignmentList';

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
  const [upsertEvent] = useMutation(UPSERT_EVENT, {
    refetchQueries: [GET_ALL_EVENTS, GET_EVENT],
  });

  const venues = useMemo(() => data?.venues?.items || [], [data]);
  const mdUp = useResponsive('up', 'md');

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


  const formSubmit = async (formData: any) => {
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
      enqueueSnackbar(currentEvent ? 'Update success!' : 'Create success!');
      if (!currentEvent) {
        router.push(paths.dashboard.admin.overtime.eventDetail.replace(':id', res.data?.event?.id));
      }
    } catch (error) {
      console.error(error);
    }
  };
  const onSubmit = handleSubmit(formSubmit);

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
            You must save the event before creating an assignment
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Assignments" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              {/* TODO: This button will open an edit assignment page */}
              <Button
                variant="contained"
                disabled={!currentEvent?.id || !isValid}
                startIcon={<Iconify icon="ic:baseline-add" />}
                onClick={() => {}}
              >Add Assignment</Button>
            </Box>
            {/* TODO: This will render a standard list that shows the assignment name, start/end date, # open shifts */}
            {
              (currentEvent?.assignments || []).map((assignment) => (
                <Accordion>
                  <AccordionSummary
                    expandIcon={<Iconify icon="mdi:chevron-down" />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                  >
                    <Typography>{ assignment.name }</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography>
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                      malesuada lacus ex, sit amet blandit leo lobortis eget.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))
            }
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
      </Grid>
    </FormProvider>
  );
}
