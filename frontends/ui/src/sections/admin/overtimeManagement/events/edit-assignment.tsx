import { useMemo, useEffect } from 'react';
import omitDeep from 'omit-deep';
import * as Yup from 'yup';
import { useMutation, useQuery } from '@apollo/client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
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
import { Assignment, Equipment, EventStatus, Rank, Shift, Skill } from 'src/__generated__/resolvers-types';
// components
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFEditor,
  RHFTextField,
  RHFSwitch,
  RHFAutocomplete,
  RHFAssignmentShiftSlots,
  RHFSigningAuthorityAutocomplete,
  RHFSkillAutocomplete,
} from 'src/components/hook-form';
import { RouterLink } from 'src/routes/components';
import { GET_EVENT, GET_EVENT_WITH_SUPERVISOR_OVERRIDE } from 'src/api/event';
import { GET_ASSIGNMENT, UPSERT_ASSIGNMENT } from 'src/api/assignment';
import { GET_EQUIPMENT_SLIM } from 'src/api/equipment';
import { useFeatures } from 'src/hooks/use-features';
import RHFRankAutocomplete from 'src/components/ranks/rhf-rank';
import { EditReportingLocation } from 'src/components/events/reporting-location/edit-reporting-location';
import AssignmentShiftsTable from './assignment-shifts-table';

// ----------------------------------------------------------------------

type Props = {
  eventId: string;
  currentAssignment?: Assignment;
  assignmentTemplateView?: boolean; // New prop to toggle between views
};

export default function EditAssignment({
  eventId,
  currentAssignment,
  assignmentTemplateView = false, // Default to shifts table view
}: Props) {
  const { data: eventData } = useQuery(GET_EVENT_WITH_SUPERVISOR_OVERRIDE, {
    variables: { id: eventId },
  });
  const basePath = assignmentTemplateView ? paths.dashboard.admin.overtime.templates : paths.dashboard.admin.overtime;
  const {
    equipment: equipmentFeature,
    lasdEventFields,
    callSign,
    signingAuthorityAssignment,
  } = useFeatures();
  const router = useRouter();

  const allDisabled = useMemo(() => {
    const hasInvalidStatus = [EventStatus.Removed].includes(currentAssignment?.event?.status || '' as any);
    const isRemoved = currentAssignment?.removedAt || currentAssignment?.event?.removedAt;
    return Boolean(hasInvalidStatus || isRemoved);
  }, [currentAssignment?.event?.status, currentAssignment?.event?.removedAt, currentAssignment?.removedAt]);
  const isComplete = useMemo(() => {
    if (assignmentTemplateView) return false;
    const completeStatus = currentAssignment?.event?.status === EventStatus.Complete;
    const completeEndTime = currentAssignment?.event?.endTime ? Date.now() >= new Date(currentAssignment.event.endTime).valueOf() : false;
    return completeStatus || completeEndTime;
  }, [
    assignmentTemplateView,
    currentAssignment?.event?.endTime,
    currentAssignment?.event?.status
  ]);

  const { data: equipmentData } = useQuery(GET_EQUIPMENT_SLIM, {
    fetchPolicy: 'network-only', // Used for first execution
    nextFetchPolicy: 'cache-first', // Used for subsequent executions
    variables: {
      input: {
        active: true,
      }
    },
  });
  const [upsertAssignment, { loading: upsertAssignmentLoading }] = useMutation(UPSERT_ASSIGNMENT, {
    refetchQueries: [GET_EVENT, GET_ASSIGNMENT],
  });

  const equipment = equipmentData?.equipments?.items || [];
  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const NewAssignmentSchema = Yup.object().shape({
    id: Yup.string(),
    name: Yup.string().required('Name is required'),
    callSign: Yup.string().nullable(),
    description: Yup.string(),
    eventId: Yup.string(),
    reportingLocation: Yup.string().nullable(),
    bwNeeded: Yup.boolean(),
    notifyWhenFullyStaffed: Yup.boolean(),
    requiredSkills: Yup.array(),
    requiredEquipment: Yup.array(),
    ranks: Yup.array().min(1).required('At least one rank is required'),
    shifts: Yup.array(),
    isSigningAuthority: Yup.boolean(),
    supervisorAssignment: Yup.object().nullable(),
    lieutenantAssignment: Yup.object().nullable(),
    fieldSupervisorAssignment: Yup.object().nullable(),
    allowOfficerCheckIn: Yup.boolean().nullable(),
    geoFence: Yup.array().nullable(),
    reportingLocationPosition: Yup.array().nullable(),
    reportingLocationAddress: Yup.object().nullable(),
    reportingTime: Yup.date().nullable(),
    uniform: Yup.string().nullable(),
    briefingTime: Yup.date().nullable(),
    briefingLocation: Yup.string().nullable(),
    includeDriveTime: Yup.boolean().nullable(),
    useSupervisorAssignmentOverride: Yup.boolean().nullable(),
    useLieutenantAssignmentOverride: Yup.boolean().nullable(),
    useFieldSupervisorAssignmentOverride: Yup.boolean().nullable(),
    assignmentDivision: Yup.object().nullable(),
    assignmentGroup: Yup.object().nullable(),
    branch: Yup.object().nullable(),
    shiftSlots: Yup.array().of(
      Yup.object().shape({
        slotCount: Yup.number().positive().nullable(),
        slotDetails: Yup.array().of(
          Yup.object().shape({
            index: Yup.number(),
            callSign: Yup.string().nullable(),
            customId: Yup.string().nullable(),
            locked: Yup.boolean().default(false),
          })
        ).nullable(),
      }).nullable()
    ).nullable() as any,
  });

  const defaultValues = useMemo(
    () => ({
      id: currentAssignment?.id,
      name: currentAssignment?.name || '',
      callSign: currentAssignment?.callSign,
      description: currentAssignment?.description || '',
      eventId,
      reportingLocation: currentAssignment?.reportingLocation || '',
      bwNeeded: currentAssignment?.bwNeeded || false,
      notifyWhenFullyStaffed: currentAssignment?.notifyWhenFullyStaffed || false,
      requiredSkills: currentAssignment?.requiredSkills || [],
      requiredEquipment: currentAssignment?.requiredEquipment || [],
      ranks: currentAssignment?.ranks || [],
      shifts: currentAssignment?.shifts || [],
      supervisorAssignment: currentAssignment?.supervisorAssignment || null,
      lieutenantAssignment: currentAssignment?.lieutenantAssignment || null,
      fieldSupervisorAssignment: currentAssignment?.fieldSupervisorAssignment || null,
      useSupervisorAssignmentOverride: !!currentAssignment?.useSupervisorAssignmentOverride,
      useLieutenantAssignmentOverride: !!currentAssignment?.useLieutenantAssignmentOverride,
      useFieldSupervisorAssignmentOverride: !!currentAssignment?.useFieldSupervisorAssignmentOverride,
      isSigningAuthority: !!currentAssignment?.isSigningAuthority,
      allowOfficerCheckIn: currentAssignment?.allowOfficerCheckIn || false,
      geoFence: currentAssignment?.geoFence || null,
      uniform: currentAssignment?.uniform || '',
      reportingTime: currentAssignment?.reportingTime ? new Date(currentAssignment?.reportingTime) : null,
      briefingTime: currentAssignment?.briefingTime ? new Date(currentAssignment?.briefingTime) : null,
      assignmentDivision: currentAssignment?.assignmentDivision || null,
      assignmentGroup: currentAssignment?.assignmentGroup || null,
      branch: currentAssignment?.branch || null,
      briefingLocation: currentAssignment?.briefingLocation || '',
      includeDriveTime: 'includeDriveTime' in (currentAssignment || {}) ? currentAssignment?.includeDriveTime : true,
      reportingLocationPosition: currentAssignment?.reportingLocationDetails?.location?.latitude && currentAssignment?.reportingLocationDetails?.location?.longitude ? [currentAssignment?.reportingLocationDetails?.location?.longitude, currentAssignment?.reportingLocationDetails?.location?.latitude] : null,
      reportingLocationAddress: currentAssignment?.reportingLocationDetails?.fullAddress ? {
        id: currentAssignment?.reportingLocationDetails?.fullAddress,
        place_name: currentAssignment?.reportingLocationDetails?.fullAddress,
        place_name_en: currentAssignment?.reportingLocationDetails?.fullAddress,
      } : null,
      shiftSlots: (currentAssignment?.shiftSlots || []).map((slot) => ({
        id: slot!.id,
        slotCount: slot!.slotCount,
        slotDetails: slot!.slotDetails ? omitDeep(JSON.parse(JSON.stringify(slot!.slotDetails)), ['__typename']) : new Array(slot!.slotCount || 1).fill({
          index: 0,
          callSign: null,
          customId: null,
          locked: false,
        }).map((detail, index) => ({ ...detail, index })),
      })),
    }),
    [currentAssignment, eventId]
  );

  const methods = useForm({
    resolver: yupResolver(NewAssignmentSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    getValues,
    setValue,
    formState: { isSubmitting, isValid },
  } = methods;

  const { isSigningAuthority } = getValues();

  useEffect(() => {
    if (currentAssignment) {
      reset(defaultValues);
    }
  }, [currentAssignment, defaultValues, reset]);

  const formSubmit = async (formData: any, {
    reroute,
  } = {
    reroute: 'assignment',
  }) => {
    try {
      const res = await upsertAssignment({
        variables: {
          input: {
            id: formData?.id,
            name: formData?.name,
            description: formData?.description,
            callSign: formData?.callSign,
            ...(formData?.reportingLocation?.trim() !== '' && !!formData?.reportingLocation && { reportingLocation: formData?.reportingLocation }),
            reportingLocation: formData?.reportingLocation,
            eventId,
            bwNeeded: formData?.bwNeeded,
            notifyWhenFullyStaffed: formData?.notifyWhenFullyStaffed,
            requiredEquipmentIds: formData?.requiredEquipment?.map(({ id }: Equipment) => id),
            requiredSkillIds: formData?.requiredSkills?.map(({ id }: Skill) => id),
            rankIds: formData?.ranks?.map(({ id }: Rank) => id),
            shiftIds: formData?.shifts?.map(({ id }: Shift) => id),
            supervisorAssignmentId: formData?.supervisorAssignment?.id,
            lieutenantAssignmentId: formData?.lieutenantAssignment?.id,
            fieldSupervisorAssignmentId: formData?.fieldSupervisorAssignment?.id,
            isSigningAuthority: formData?.isSigningAuthority,
            allowOfficerCheckIn: formData?.allowOfficerCheckIn || false,
            includeDriveTime: formData?.includeDriveTime,
            geoFence: formData?.geoFence || null,
            useSupervisorAssignmentOverride: formData?.useSupervisorAssignmentOverride || false,
            useLieutenantAssignmentOverride: formData?.useLieutenantAssignmentOverride || false,
            useFieldSupervisorAssignmentOverride: formData?.useFieldSupervisorAssignmentOverride || false,
            uniform: formData?.uniform?.trim?.(),
            reportingTime: formData?.reportingTime?.toISOString?.(),
            briefingTime: formData?.briefingTime?.toISOString?.(),
            briefingLocation: formData?.briefingLocation?.trim?.(),
            assignmentDivisionId: formData?.assignmentDivision?.id,
            assignmentGroupId: formData?.assignmentGroup?.id,
            branchId: formData?.branch?.id,
            // Only send shiftSlots if they exist to avoid overwriting existing slots with []
            ...(formData?.shiftSlots?.length > 0 ? { shiftSlots: formData?.shiftSlots } : {}),
            reportingLocationDetails: formData?.reportingLocationPosition || formData?.reportingLocationAddress ? {
              fullAddress: formData?.reportingLocationAddress?.place_name_en || '',
              ...(formData?.reportingLocationPosition && {
                location: {
                  latitude: formData?.reportingLocationPosition[1],
                  longitude: formData?.reportingLocationPosition[0],
                }
              })
            } : null,
          },
        },
      });
      if (reroute === 'assignment') {
        if (!currentAssignment) {
          router.push(basePath.eventAssignmentDetail
            .replace(':eventId', res.data?.assignment?.eventId)
            .replace(':assignmentId', res.data?.assignment?.id)
          );
        }
      }
      if (reroute === 'event') {
        router.push(basePath.eventDetail
          .replace(':eventId', res.data?.assignment?.eventId)
        );
      }
      return res.data?.assignment.id;
    } catch (error) {
      enqueueSnackbar('Failed to save changes. Please try again.', { variant: 'error' });
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
        <Grid md={2}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            Details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Name, notes, etc.
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={10}>
        <Card>
          {!mdUp && <CardHeader title="Details" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <RHFTextField disabled={allDisabled} name="name" label="Name" />

            {callSign && (
              <RHFTextField
                disabled={allDisabled}
                name="callSign"
                label="Call Sign"
              />
            )}

            <Stack direction="row" spacing={2}>
              {
                signingAuthorityAssignment && (
                  <RHFSwitch
                    helperText={(currentAssignment?.shifts?.length || 0) > 1 ? 'Supervisor assignments are only allowed with a single shift slot' : ''}
                    disabled={(currentAssignment?.shifts?.length || 0) > 1}
                    name="isSigningAuthority"
                    label="Supervisor"
                  />
                )
              }
              { lasdEventFields && (<RHFSwitch name="includeDriveTime" label="Include Drive Time" />) }
            </Stack>

            {
              lasdEventFields && (
                <Stack direction="row" spacing={1.5} paddingBottom={1.5}>
                  <Stack spacing={1} flex={1}>
                    <RHFSigningAuthorityAutocomplete
                      eventId={eventId}
                      name="supervisorAssignment"
                      label='Pre-Approval Supervisor'
                      disabled={allDisabled}
                      helperText="Incident commander assignment that oversees the event and will be included on all shift documents"
                    />
                    <RHFSwitch
                      name="useSupervisorAssignmentOverride"
                      label={<span>Outside Supervisor<br />{eventData?.event?.overrideSupervisor ? `${eventData?.event?.overrideSupervisor?.name} - ${eventData?.event?.overrideSupervisor?.member?.rank?.name}` : '' }</span>}
                      disabled={allDisabled}
                    />
                  </Stack>
                  <Stack spacing={1} flex={1}>
                    <RHFSigningAuthorityAutocomplete
                      eventId={eventId}
                      name="lieutenantAssignment"
                      label='Signing Supervisor Override'
                      disabled={allDisabled}
                      helperText="Supervisor assignment that will sign off all shift confirmation documents."
                    />
                    <RHFSwitch
                      name="useLieutenantAssignmentOverride"
                      label={<span>Outside Supervisor<br />{eventData?.event?.overrideSupervisor ? `${eventData?.event?.overrideSupervisor?.name} - ${eventData?.event?.overrideSupervisor?.member?.rank?.name}` : '' }</span>}
                      disabled={allDisabled}
                    />
                  </Stack>
                  <Stack spacing={1} flex={1}>
                    <RHFSigningAuthorityAutocomplete
                      eventId={eventId}
                      name="fieldSupervisorAssignment"
                      label='Field Supervisor'
                      disabled={allDisabled}
                      helperText="Field Supervisor assignment."
                    />
                    <RHFSwitch
                      name="useFieldSupervisorAssignmentOverride"
                      label={<span>Outside Supervisor<br />{eventData?.event?.overrideSupervisor ? `${eventData?.event?.overrideSupervisor?.name} - ${eventData?.event?.overrideSupervisor?.member?.rank?.name}` : '' }</span>}
                      disabled={allDisabled}
                    />
                  </Stack>
                </Stack>
              )
            }

            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Notes</Typography>
              <RHFEditor readOnly={allDisabled} simple name="description" />
            </Stack>

            <RHFRankAutocomplete
              name="ranks"
              setValue={setValue}
              disabled={allDisabled}
              isComplete={isComplete}
            />

            <RHFSkillAutocomplete
              name="requiredSkills"
              label="Required Skills"
              disabled={allDisabled || isComplete}
              helperText="Leave empty to not require any skills"
            />

            {
              equipmentFeature && (
                <RHFAutocomplete
                  name="requiredEquipment"
                  placeholder="Required Equipment"
                  disabled={allDisabled || isComplete}
                  multiple
                  disableCloseOnSelect
                  helperText="Leave empty to not require any equipment"
                  options={(equipment || [])}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  getOptionLabel={(e: any) => e?.name}
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
              )
            }


            <Stack direction="row" spacing={2}>
              {
                !lasdEventFields && (
                  <RHFSwitch disabled={allDisabled || isComplete} name="bwNeeded" label="B&W Needed" />
                )
              }
              <RHFSwitch disabled={allDisabled || isComplete} name="notifyWhenFullyStaffed" label="Notify when fully staffed" />
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderShifts = (
    <>
      {mdUp && (
        <Grid md={2}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            {assignmentTemplateView ? 'Shift Slots' : 'Shifts'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {assignmentTemplateView 
              ? 'Define shift slot templates for this assignment' 
              : 'All shifts for this assignment'}
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={10}>
        <Card>
          {!mdUp && <CardHeader title={assignmentTemplateView ? 'Shift Slots' : 'Shifts'} />}
          
          {assignmentTemplateView ? (
            <RHFAssignmentShiftSlots
              name="shiftSlots"
              isSupervisorAssignment={!!isSigningAuthority}
              allDisabled={allDisabled}
              isComplete={isComplete}
            />
          ) : (
            <AssignmentShiftsTable 
              eventId={eventId}
              isSigningAuthority={!!isSigningAuthority}
              currentAssignment={currentAssignment}
              allDisabled={allDisabled}
              isComplete={isComplete}
              isValid={isValid}
              upsertAssignmentLoading={upsertAssignmentLoading}
              createAssignmentWithValues={(values) => formSubmit(values, { reroute: 'assignment' })}
              getFormValues={getValues}
            />
          )}
        </Card>
      </Grid>
    </>
  );

  const renderActions = (
    <>
      {mdUp && <Grid md={2} />}
      <Grid xs={12} md={10} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Button
          component={RouterLink}
          variant='outlined'
          size="large"
          href={basePath.eventDetail.replace(':eventId', eventId)}
        >Cancel</Button>
        <LoadingButton
          type="button"
          variant="outlined"
          size="large"
          loading={isSubmitting}
          disabled={allDisabled}
          sx={{ ml: 2 }}
          onClick={() => formSubmit(getValues(), { reroute: 'event' })}
        >
          Save & Close
        </LoadingButton>
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

        <EditReportingLocation includeAssignmentFields checkLabel="Set Assignment-Specific Check-in/out Location" />

        {renderShifts}

        {renderActions}
      </Grid>
    </FormProvider>
  );
}
