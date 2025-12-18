import { useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
// mui
import Divider from '@mui/material/Divider/Divider';
import LoadingButton from '@mui/lab/LoadingButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
// types
import { Shift } from "src/__generated__/resolvers-types";
import { useBoolean, UseBooleanReturnType } from "src/hooks/use-boolean";
import { EDIT_CHECK_IN_OUT, GET_SHIFT_OVERVIEW, DEMOBILIZE_SHIFT } from 'src/api/shifts';
import { GET_USER_SHIFT_ACTIVITY } from 'src/api/user';
import { UPSERT_ASSIGNMENT } from 'src/api/assignment';
// hooks
import { convertDate } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';
import { useFeatures } from 'src/hooks/use-features';
import { getShiftStatus } from 'src/utils/shifts';
// components
import ConfirmDialogWithForm from "src/components/custom-dialog/confirm-dialog-with-form";
import QueryView from 'src/components/query-view';
import Label from 'src/components/label';
import { EventNotificationDialog } from 'src/components/events/notifications/event-notification-dialog';
import CheckInOut from 'src/components/shifts/check-in-out'; // eslint-disable-line import/no-cycle
import { ConfirmDialog } from 'src/components/custom-dialog';
import ShiftOverviewSection from './shift-overview-section';
import ShiftOverviewEvent from './shift-overview-event';
import ShiftOverviewAssignment from './shift-overview-assignment';
import ShiftOverviewReporting from './shift-overview-reporting';
import ShiftOverviewTeam from './shift-overview-team';
import ShiftOverviewPersonalInfo from './shift-overview-personal-info';
import ShiftOverviewEquipment from './shift-overview-equipment';
import ShiftOverviewTimeKeeping from './shift-overview-timekeeping';
import { EventUserActionsResponse } from '../groupedByEvent/shift-activitiy-dialog';
import ShiftOverviewActivity from './shift-activity';
import ShiftNotifications from './shift-notifications';

interface Props {
  controller: UseBooleanReturnType<Shift>;
  refetch?: () => Promise<any>;
  closeOnSave?: boolean;
  isAdminView: boolean;
};

const OverviewForm = Yup.object().shape({
  id: Yup.string().required(),
  callSign: Yup.string().nullable(),
  assignment: Yup.object().shape({
    id: Yup.string().required(),
    name: Yup.string().nullable(),
    eventId: Yup.string().nullable(),
    includeDriveTime: Yup.boolean().default(false),
  }),
  customId: Yup.string().nullable(),
  checkInTime: Yup.date().nullable(),
  checkOutTime: Yup.date().nullable(),
  checkInEquipmentTime: Yup.date().nullable(),
  checkOutEquipmentTime: Yup.date().nullable(),
  vehicleCategory: Yup.string().nullable(),
  checkInNote: Yup.string().nullable(),
  checkOutNote: Yup.string().nullable(),
  adminNotes: Yup.string().nullable(),
  noShow: Yup.boolean().default(false),
  regenerateDocusign: Yup.boolean().default(false),
});

export const ShiftOverviewDialog = ({
  controller,
  refetch: inputRefetch,
  closeOnSave,
  isAdminView,
}: Props) => {
  const id = useMemo(() => controller.attribute?.id || '', [controller.attribute]);
  const { enqueueSnackbar } = useSnackbar();
  const { vehicleCategories, officerCheckInOut } = useFeatures();
  const demobilizationConfirm = useBoolean();
  const eventNotificationController = useBoolean<Shift>();
  const [editCheckInOut] = useMutation(EDIT_CHECK_IN_OUT);
  const [editAssignment] = useMutation(UPSERT_ASSIGNMENT);
  const [demobilizeShift, { loading: demobilizeLoading }] = useMutation(DEMOBILIZE_SHIFT);
  const { user } = useAuthContext();
  const { data, loading, error, refetch } = useQuery(GET_SHIFT_OVERVIEW, {
    fetchPolicy: 'no-cache',
    variables: {
      id,
    },
    skip: !id,
  });
  const shift = data?.shift as Shift | undefined;
  const shiftStatus = getShiftStatus(shift);
  const isCurrentUser = useMemo(() => user?.id === shift?.userId, [user, shift]);
  const isCheckedIn = useMemo(() => !!shift?.shiftCheckInOut?.checkInTime, [shift]);
  const bypassDemobilization = useMemo(() =>
    shift?.event.bypassDemobilization || shift?.assignment.bypassDemobilization || shift?.bypassDemobilization
  , [shift]);

  const setOverviewShift = useCallback((newShiftId: string) => {
    controller.onTrue({ id: newShiftId } as unknown as Shift);
  }, [controller]);

  const { data: activityData } = useQuery<EventUserActionsResponse>(GET_USER_SHIFT_ACTIVITY, {
    variables: {
      input: {
        shiftGroupId: shift?.shiftId,
        userId: shift?.user?.id,
        orderBy: 'timestamp',
        order: 'desc',
      },
    },
    skip: !shift,
  });

  const defaultValues = useMemo(() => ({
    id: shift?.id || '',
    callSign: shift?.callSign || shift?.assignment.callSign || '',
    assignment: {
      id: shift?.assignment.id || '',
      name: shift?.assignment.name || '',
      eventId: shift?.event.id || '',
      includeDriveTime: shift?.assignment.includeDriveTime || false,
    },
    customId: shift?.customId,
    checkInNote: shift?.shiftCheckInOut?.checkInNote,
    checkOutNote: shift?.shiftCheckInOut?.checkOutNote,
    adminNotes: shift?.shiftCheckInOut?.adminNotes || '',
    vehicleCategory: shift?.shiftCheckInOut?.equipmentDetails?.vehicleCategory?.id,
    checkInEquipmentTime: shift?.shiftCheckInOut?.equipmentDetails?.checkInTime ? convertDate({
      date: new Date(shift.shiftCheckInOut.equipmentDetails.checkInTime),
      user
    }).toDate() : undefined,
    checkOutEquipmentTime: shift?.shiftCheckInOut?.equipmentDetails?.checkOutTime ? convertDate({
      date: new Date(shift.shiftCheckInOut.equipmentDetails.checkOutTime),
      user
    }).toDate() : undefined,
    checkInTime: shift?.shiftCheckInOut?.checkInTime ? convertDate({
      date: new Date(shift.shiftCheckInOut.checkInTime),
      user
    }).toDate() : undefined,
    checkOutTime: shift?.shiftCheckInOut?.checkOutTime ? convertDate({
      date: new Date(shift.shiftCheckInOut.checkOutTime),
      user
    }).toDate() : undefined,
    noShow: shift?.shiftCheckInOut?.noShow || false,
    regenerateDocusign: false,
  }), [shift, user]);

  const handleClose = () => {
    controller.onFalse();
  }

  const methods = useForm({
    resolver: yupResolver(OverviewForm),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, dirtyFields, isDirty },
  } = methods;

  useEffect(() => {
    if (controller.attribute) {
      reset(defaultValues);
    }
  }, [controller.attribute, defaultValues, reset]);

  const triggerDemobilize = async () => {
    try {
      if (shift?.shiftId) {
        await demobilizeShift({
          variables: {
            shiftId: shift.shiftId,
          }
        });
        enqueueSnackbar('Shift group demobilized successfully', { variant: 'success', autoHideDuration: 4000 });
        refetch();
        if (inputRefetch) {
          inputRefetch();
        }
      }
    } catch(_) {
      enqueueSnackbar('Failed to demobilize shift group', { variant: 'error', autoHideDuration: 4000 });
    }
  }

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const dirtyAssignmentFields = [
        dirtyFields.assignment?.includeDriveTime,
      ];
      if (dirtyAssignmentFields.some(Boolean)) {
        await editAssignment({
          variables: {
            input: {
              id: formData.assignment.id,
              includeDriveTime: formData.assignment.includeDriveTime,
              name: formData.assignment.name,
              eventId: formData.assignment.eventId,
            }
          },
        });
      }

      const payload: any = {
        id: formData.id,
        customShiftId: formData.customId,
        adminNotes: formData.adminNotes,
        noShow: formData.noShow,
        regenerateDocusign: formData.regenerateDocusign,
      }

      if (dirtyFields.callSign && formData.callSign) {
        payload.callSign = formData.callSign;
      }
      
      if (dirtyFields.checkInTime && formData.checkInTime) {
        payload.checkInTime = formData.checkInTime.toISOString();
      }

      if (dirtyFields.checkOutTime && formData.checkOutTime) {
        payload.checkOutTime = formData.checkOutTime.toISOString();
      }

      if (formData.vehicleCategory && vehicleCategories) {
        payload.equipmentDetails = payload.equipmentDetails || {};
        payload.equipmentDetails.vehicleCategoryId = formData.vehicleCategory;
      }

      if (formData.checkInEquipmentTime) {
        payload.equipmentDetails = payload.equipmentDetails || {};
        payload.equipmentDetails.checkInTime = formData.checkInEquipmentTime;
      }

      if (formData.checkOutEquipmentTime) {
        payload.equipmentDetails = payload.equipmentDetails || {};
        payload.equipmentDetails.checkOutTime = formData.checkOutEquipmentTime;
      }

      await editCheckInOut({
        variables: {
          input: payload,
        },
      });

      const messaging: any = {
        message: 'Shift details updated successfully',
        options: { variant: 'success', autoHideDuration: 4000 },
      };
      if (formData.regenerateDocusign) {
        messaging.message = 'Shift details updated and end of shift document resent successfully';
        messaging.options = { variant: 'success', persist: true };
      }

      enqueueSnackbar(messaging.message, messaging.options);
      if (inputRefetch) {
        inputRefetch();
      }
      if (closeOnSave) {
        handleClose();
      }
    } catch(err) {
      enqueueSnackbar('Failed to update shift details', { variant: 'error', autoHideDuration: 4000 });
    }
  });

  return (
    <>
      <ConfirmDialogWithForm
        methods={methods}
        handleSubmit={onSubmit}
        action={
          isAdminView ? (
            <Stack spacing={2} direction="row" mr={2}>
              <LoadingButton
                type="submit"
                disabled={!isDirty}
                loading={isSubmitting}
                variant="contained"
                color="primary"
              >
                Save
              </LoadingButton>
            </Stack>
          ) : null
        }
        TransitionProps={{
          // wait for animation to end on closing
          onExited: handleClose,
        }}
        open={controller.value}
        onClose={handleClose}
        title={(
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography component='h2' variant='h4'>Shift Overview</Typography>
            {(isAdminView || isCheckedIn) && (
              <Label variant="soft" color={shiftStatus.color}>
                {shiftStatus.value}
              </Label>
            )}
          </Stack>
        )}
        maxWidth='md'
        content={(
          <QueryView
            loading={loading}
            error={!!error}
            errorTitle='Failed to load Shift Overview'
            errorDescription='There was an error loading the shift overview. Please try again.'
            refetch={refetch}
            sx={{ minHeight: '90vh', background: 'transparent' }}
          >
            {isCurrentUser && (<CheckInOut allowView={officerCheckInOut} fromSelfCheckout hiddenTitle />)}
            <ShiftOverviewSection icon="ic:baseline-notifications-active" title="Notifications">
              <ShiftNotifications shift={shift} />
            </ShiftOverviewSection>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <ShiftOverviewSection icon="solar:golf-bold-duotone" title="Event Details">
              <ShiftOverviewEvent event={shift?.event} />
            </ShiftOverviewSection>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <ShiftOverviewSection
              icon="mdi-assignment"
              title="Assignment Details"
              sectionActions={isAdminView ? (
                <Stack direction="row" spacing={2}>
                  <Button onClick={(e) => {
                    e.stopPropagation();
                    eventNotificationController.onTrue(controller.attribute);
                  }} variant='outlined' color='info'>Notify</Button>
                  {
                    !bypassDemobilization && (
                      <LoadingButton onClick={(e) => {
                        e.stopPropagation();
                        demobilizationConfirm.onTrue();
                      }} variant='outlined' color='warning'>Demobilize</LoadingButton>
                    )
                  }
                </Stack>
              ): null}
            >
              <ShiftOverviewAssignment isCheckedIn={isCheckedIn} isAdminView={isAdminView} assignment={shift?.assignment} shift={shift} event={shift?.event} />
            </ShiftOverviewSection>
            <Divider sx={{ borderStyle: 'dashed' }} />
            <ShiftOverviewSection icon="mdi-report" title="Reporting Instructions">
              <ShiftOverviewReporting isCheckedIn={isCheckedIn} isAdminView={isAdminView} assignment={shift?.assignment} event={shift?.event} shift={shift} />
            </ShiftOverviewSection>
            <Divider sx={{ borderStyle: 'dashed' }} />
            {
              (isCheckedIn || isAdminView) && (
                <>
                  <ShiftOverviewSection icon="clarity:group-solid" title="Team">
                    <ShiftOverviewTeam userId={shift?.userId || undefined} event={shift?.event} assignment={shift?.assignment} isAdminView={isAdminView} setOverviewShift={setOverviewShift} />
                  </ShiftOverviewSection>
                  <Divider sx={{ borderStyle: 'dashed' }} />
                </>
              )
            }
            <ShiftOverviewSection icon="solar:user-id-bold" title="Personal Information">
              <ShiftOverviewPersonalInfo shift={shift} />
            </ShiftOverviewSection>
            <Divider sx={{ borderStyle: 'dashed' }} />
            {
              (isCheckedIn || isAdminView) && (
                <>
                  <ShiftOverviewSection icon="ic:baseline-directions-car" title="Equipment">
                    <ShiftOverviewEquipment shift={shift} isAdminView={isAdminView} />
                  </ShiftOverviewSection>
                  <Divider sx={{ borderStyle: 'dashed' }} />
                  <ShiftOverviewSection icon="mdi:clock-time-four-outline" title="Timekeeping">
                    <ShiftOverviewTimeKeeping shift={shift} activityData={activityData} isAdminView={isAdminView} />
                  </ShiftOverviewSection>
                  <Divider sx={{ borderStyle: 'dashed' }} />
                  <ShiftOverviewSection icon="mdi:chart-timeline" title="Activity">
                    <ShiftOverviewActivity activityData={activityData} />
                  </ShiftOverviewSection>
                </>
              )
            }
          </QueryView>
        )}
      />
      <EventNotificationDialog controller={eventNotificationController} />
      <ConfirmDialog
        open={demobilizationConfirm.value}
        onClose={demobilizationConfirm.onFalse}
        title="Demobilize assignment"
        content="Are you sure you want to demobilize this assignment?"
        action={
          <LoadingButton 
            variant="outlined"
            color="warning"
            loading={demobilizeLoading}
            onClick={() => triggerDemobilize()}
          >
            Demobilize
          </LoadingButton>
        }
      />
    </>
  )
};
