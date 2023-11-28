import { useMemo, useEffect, useState, useCallback } from 'react';
import * as Yup from 'yup';
import { useMutation, useQuery } from '@apollo/client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { isAfter, isBefore } from 'date-fns';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Checkbox from '@mui/material/Checkbox';
// hooks
import { useResponsive } from 'src/hooks/use-responsive';
// routes
import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
// types
import { Assignment, EventStatus, Rank, Shift, Skill } from 'src/__generated__/resolvers-types';
// components
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFEditor,
  RHFTextField,
  RHFSwitch,
  RHFAutocomplete,
} from 'src/components/hook-form';
import { RouterLink } from 'src/routes/components';
import { GET_ALL_EVENTS, GET_EVENT } from 'src/api/event';
import { GET_ASSIGNMENT, UPSERT_ASSIGNMENT } from 'src/api/assignment';
import { GET_RANKS } from 'src/api/rank';
import { GET_SKILL_SLIM } from 'src/api/skill';
import { useBoolean } from 'src/hooks/use-boolean';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { GET_ALL_SHIFTS, REMOVE_SHIFTS } from 'src/api/shifts';
import { TableConfig } from 'src/components/table/table-config';
import GQLTable from 'src/components/table/gql/table';

// ----------------------------------------------------------------------

type Props = {
  eventId: string;
  currentAssignment?: Assignment;
};

export default function EditAssignment({
  eventId,
  currentAssignment,
}: Props) {
  const router = useRouter();

  const [removeShiftId, setRemoveShiftId] = useState<string | null>();
  const deleteConfirm = useBoolean();
  const allDisabled = useMemo(() => [EventStatus.Complete, EventStatus.Removed].includes(currentAssignment?.event?.status || '' as any), [currentAssignment?.event?.status]);

  const shiftMeta = useMemo(() =>
    Object.values((currentAssignment?.shifts || []).reduce((acc, shift) => {
      const { shiftId } = shift!;
      if (!acc[shiftId]) {
        acc[shiftId] = {
          shiftId,
          openShifts: 0,
          startTime: shift!.startTime,
          endTime: shift!.endTime,
        };
      }
      acc[shiftId].openShifts += shift?.userId ? 0 : 1;

      if (isBefore(new Date(shift!.startTime), new Date(acc[shiftId].startTime))) {
        acc[shiftId].startTime = shift!.startTime;
      }
      if (isAfter(new Date(shift!.endTime), new Date(acc[shiftId].endTime))) {
        acc[shiftId].endTime = shift!.endTime;
      }

      return acc;
    }, {} as any)),
  [currentAssignment?.shifts]);

  const { data: rankData } = useQuery(GET_RANKS, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        active: true,
      }
    },
  });
  const { data: skillData } = useQuery(GET_SKILL_SLIM, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        active: true,
      }
    },
  });
  const [removeShifts, { loading: removeShitLoading }] = useMutation(REMOVE_SHIFTS, {
    refetchQueries: [GET_ALL_EVENTS, {
      query: GET_EVENT,
      variables: {
        id: eventId,
      },
    }, {
      query: GET_ASSIGNMENT,
      variables: {
        id: currentAssignment?.id,
      },
    }],
  });
  const [upsertAssignment, { loading: upsertAssignmentLoading }] = useMutation(UPSERT_ASSIGNMENT, {
    refetchQueries: [GET_EVENT, GET_ASSIGNMENT],
  });

  const openRemoveShift = useCallback((shiftId: string) => {
    setRemoveShiftId(shiftId);
    deleteConfirm.onTrue();
  }, [deleteConfirm, setRemoveShiftId]);

  const handleRemoveShift = useCallback(async () => {
    await removeShifts({
      variables: {
        id: removeShiftId,
      },
    });
    setRemoveShiftId(null);
    deleteConfirm.onFalse();
  }, [removeShifts, setRemoveShiftId, removeShiftId, deleteConfirm]);

  const skills = skillData?.skills?.items || [];
  const ranks = rankData?.ranks?.items || [];
  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const NewEventSchema = Yup.object().shape({
    id: Yup.string(),
    name: Yup.string().required('Name is required'),
    description: Yup.string(),
    eventId: Yup.string(),
    bwNeeded: Yup.boolean(),
    notifyWhenFullyStaffed: Yup.boolean(),
    requiredSkills: Yup.array(),
    ranks: Yup.array().min(1).required('At least one rank is required'),
    shifts: Yup.array(),
  });

  const defaultValues = useMemo(
    () => ({
      id: currentAssignment?.id,
      name: currentAssignment?.name || '',
      description: currentAssignment?.description || '',
      eventId,
      bwNeeded: currentAssignment?.bwNeeded || false,
      notifyWhenFullyStaffed: currentAssignment?.notifyWhenFullyStaffed || false,
      requiredSkills: currentAssignment?.requiredSkills || [],
      ranks: currentAssignment?.ranks || [],
      shifts: currentAssignment?.shifts || [],
    }),
    [currentAssignment, eventId]
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
    if (currentAssignment) {
      reset(defaultValues);
    }
  }, [currentAssignment, defaultValues, reset]);

  const config: TableConfig<Shift> = {
    header: {
      title: 'Shifts',
      button: {
        text: 'Add Shift',
        icon: 'ic:baseline-add',
        loading: upsertAssignmentLoading,
        disabled: !currentAssignment?.id && !isValid,
        onClick: async () => {
          let assignmentId = currentAssignment?.id;
          if (!assignmentId) {
            assignmentId = await formSubmit(getValues(), false);
            enqueueSnackbar('Created Assignment!');
          }
          router.push(
            paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
            .replace(':eventId', eventId!)
            .replace(':assignmentId', assignmentId!)
            .replace(':shiftId', 'new')
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
      data: (shiftMeta || []) as any,
      query: GET_ALL_SHIFTS,
      processResult: (data: any) => ({
        total: data.length,
        items: data,
      }),
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Shift) => {
          router.push(
            paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
              .replace(':eventId', currentAssignment?.eventId || '')
              .replace(':assignmentId', currentAssignment?.id || '')
              .replace(':shiftId', row.shiftId || '')
          );
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (row: Shift) => {
          openRemoveShift(row.shiftId)
        },
      }
    ],
    columns: [
      {
        id: 'startTime',
        label: 'Start',
        columnType: 'date',
        width: '20%',
        getHref: (row: Shift) =>
          paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
            .replace(':eventId', currentAssignment?.eventId || '')
            .replace(':assignmentId', currentAssignment?.id || '')
            .replace(':shiftId', row.shiftId || ''),
      },
      {
        id: 'endTime',
        label: 'End',
        columnType: 'date',
        width: '20%',
        getHref: (row: Shift) =>
          paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
            .replace(':eventId', currentAssignment?.eventId || '')
            .replace(':assignmentId', currentAssignment?.id || '')
            .replace(':shiftId', row.shiftId || ''),
      },
      { id: 'openShifts', width: '50%', label: 'Open Shifts', columnType: 'string' },
      { id: '', width: '10%', columnType: 'action', label: '' },
    ],
    filters: []
  };

  const formSubmit = async (formData: any, shouldReroute = true) => {
    try {
      const res = await upsertAssignment({
        variables: {
          input: {
            id: formData?.id,
            name: formData?.name,
            description: formData?.description,
            eventId,
            bwNeeded: formData?.bwNeeded,
            notifyWhenFullyStaffed: formData?.notifyWhenFullyStaffed,
            requiredSkillIds: formData?.requiredSkills?.map(({ id }: Skill) => id),
            rankIds: formData?.ranks?.map(({ id }: Rank) => id),
            shiftIds: formData?.shifts?.map(({ id }: Shift) => id),
          },
        },
      });
      if (shouldReroute) {
        enqueueSnackbar(currentAssignment ? 'Update success!' : 'Create success!');
        if (!currentAssignment) {
          router.push(paths.dashboard.admin.overtime.eventAssignmentDetail
            .replace(':eventId', res.data?.assignment?.eventId)
            .replace(':assignmentId', res.data?.assignment?.id)
          );
        }
      }
      return res.data?.assignment.id;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

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
            Name, notes, etc.
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField disabled={allDisabled} name="name" label="Name" />

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Notes</Typography>
              <RHFEditor simple name="description" />
            </Stack>

            <RHFAutocomplete
              name="requiredSkills"
              placeholder="Required Skills"
              disabled={allDisabled}
              multiple
              disableCloseOnSelect
              helperText="Leave empty to not require any shifts"
              options={(skills || [])}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              getOptionLabel={(skill: any) => skill?.name}
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
              name="ranks"
              placeholder="Open to Ranks"
              multiple
              disableCloseOnSelect
              disabled={allDisabled}
              helperText="Enter the ranks that are allowed to work this assignment"
              options={(ranks || [])}
              getOptionLabel={(rank: any) => rank?.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
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

            <Stack direction="row" spacing={2}>
              <RHFSwitch disabled={allDisabled} name="bwNeeded" label="B&W Needed" />
              <RHFSwitch disabled={allDisabled} name="notifyWhenFullyStaffed" label="Notify when fully staffed" />
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderShifts = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Shifts
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            All shifts for this assignment
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          {!mdUp && <CardHeader title="Shifts" />}

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
          href={paths.dashboard.admin.overtime.eventDetail.replace(':eventId', eventId)}
        >Cancel</Button>
        <LoadingButton
          type="submit"
          variant="contained"
          size="large"
          loading={isSubmitting}
          disabled={allDisabled}
          sx={{ ml: 2 }}
        >
          {!currentAssignment ? 'Create Assignment' : 'Save Changes'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {renderDetails}

        {renderShifts}

        {renderActions}

        <ConfirmDialog
          open={deleteConfirm.value}
          onClose={deleteConfirm.onFalse}
          title="Delete"
          content="Are you sure want to delete?"
          action={
            <LoadingButton loading={removeShitLoading} variant="contained" color="error" onClick={handleRemoveShift}>
              Delete
            </LoadingButton>
          }
        />
      </Grid>
    </FormProvider>
  );
}
