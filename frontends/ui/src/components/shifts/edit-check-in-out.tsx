import { useMemo, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useMutation, useQuery } from '@apollo/client';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
// @mui
import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import Stack from "@mui/material/Stack";
import Accordion, { accordionClasses } from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
// Components
import { UseBooleanReturnType } from "src/hooks/use-boolean";
import MapMarkersPopups from 'src/components/map/map-marker-popups';
import {
  RHFDateTimePicker, RHFSwitch, RHFTextField,
} from 'src/components/hook-form';
import { useFeatures } from 'src/hooks/use-features';
// Types
import { EventUserActionLogAction, Shift } from "src/__generated__/resolvers-types";
import { useAuthContext } from "src/auth/hooks";
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
import { EDIT_CHECK_IN_OUT } from 'src/api/shifts';
import { GET_USER_SHIFT_ACTIVITY } from 'src/api/user';
import Iconify from '../iconify';
import { RHFVehicleCategoriesSelect } from '../hook-form/rhf-vehicle-categories-select';
import ConfirmDialogWithForm from '../custom-dialog/confirm-dialog-with-form';
import { StyledMapContainer } from '../map';
import { EventUserActionsResponse } from './groupedByEvent/shift-activitiy-dialog';

const baseSettings = {
  minZoom: 1,
};

export const EditCheckInOut = ({
  shift,
  editCheckInOutModal,
  handleClose,
  refetch,
  closeOnSave = false,
}: {
  shift: Shift;
  editCheckInOutModal: UseBooleanReturnType<unknown>;
  refetch?: () => Promise<any>;
  handleClose: () => void;
  closeOnSave?: boolean;
}) => {
  const {
    eventCheckIn,
    eventCheckOut,
    vehicleCategories,
    customizableShiftId,
  } = useFeatures();
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const { dateTimeFormat } = useDateFormats();
  const { data: activityData } = useQuery<EventUserActionsResponse>(GET_USER_SHIFT_ACTIVITY, {
    variables: {
      input: {
        shiftGroupId: shift?.shiftId,
        userId: shift?.user?.id,
        orderBy: 'timestamp',
        order: 'desc',
      },
    },
    skip: !shift || !editCheckInOutModal.value,
  });
  const officerComments = activityData?.eventUserActions?.items.
    filter(action => action.action === EventUserActionLogAction.OfficerCommentAdded) || [];

  const [editCheckInOut] = useMutation(EDIT_CHECK_IN_OUT);

  const EditCheckInCheckOut = Yup.object().shape({
    id: Yup.string().required(),
    customId: Yup.string().nullable(),
    checkInTime: Yup.date().nullable(),
    checkOutTime: Yup.date().nullable(),
    checkInEquipmentTime: Yup.date().nullable(),
    checkOutEquipmentTime: Yup.date().nullable(),
    vehicleCategoryId: Yup.string().nullable(),
    checkInNote: Yup.string().nullable(),
    checkOutNote: Yup.string().nullable(),
    adminNotes: Yup.string().nullable(),
    noShow: Yup.boolean().default(false),
    regenerateDocusign: Yup.boolean().default(false),
  });

  const defaultValues = useMemo(
    () => ({
      id: shift?.id,
      customId: shift?.customId,
      checkInNote: shift?.shiftCheckInOut?.checkInNote,
      checkOutNote: shift?.shiftCheckInOut?.checkOutNote,
      adminNotes: shift?.shiftCheckInOut?.adminNotes || '',
      vehicleCategoryId: shift?.shiftCheckInOut?.equipmentDetails?.vehicleCategory?.id,
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
    }),
    [shift, user]
  );

  const hasCoordinates = useMemo(() =>
    shift?.shiftCheckInOut?.checkInCoords || shift?.shiftCheckInOut?.checkOutCoords, [shift]);

  const methods = useForm({
    resolver: yupResolver(EditCheckInCheckOut),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting, isDirty, dirtyFields },
  } = methods;

  useEffect(() => {
    if (shift) {
      reset(defaultValues);
    }
  }, [shift, defaultValues, reset]);

  const onSubmit = handleSubmit(async (formData) => {
    try {
      const payload: any = {
        id: formData.id,
        customShiftId: formData.customId,
        adminNotes: formData.adminNotes,
        noShow: formData.noShow,
        regenerateDocusign: formData.regenerateDocusign,
      }
      
      if (dirtyFields.checkInTime && formData.checkInTime) {
        payload.checkInTime = formData.checkInTime.toISOString();
      }

      if (dirtyFields.checkOutTime && formData.checkOutTime) {
        payload.checkOutTime = formData.checkOutTime.toISOString();
      }

      if (formData.vehicleCategoryId && vehicleCategories) {
        payload.equipmentDetails = payload.equipmentDetails || {};
        payload.equipmentDetails.vehicleCategoryId = formData.vehicleCategoryId;
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
      // await client.refetchQueries({
      //   include: [GET_GROUPED_SHIFTS],
      // });
      if (refetch) {
        refetch();
      }
      if (closeOnSave) {
        handleClose();
      }
    } catch(error) {
      enqueueSnackbar('Failed to update shift details', { variant: 'error', autoHideDuration: 4000 });
    }
  });

  return (
    <ConfirmDialogWithForm
      methods={methods}
      handleSubmit={onSubmit}
      action={
        <Stack spacing={2} direction="row" mr={2}>
          <RHFSwitch disabled={!shift?.shiftCheckInOut?.checkInTime || !shift?.shiftCheckInOut?.checkOutTime} name="regenerateDocusign" label="Regenerate End of Shift Document" sx={{ mr: 'auto' }} />
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
      }
      TransitionProps={{
        // wait for animation to end on closing
        onExited: handleClose,
      }}
      open={editCheckInOutModal.value}
      onClose={handleClose}
      title="Shift Details"
      maxWidth='md'
      content={(
        <Stack spacing={2} sx={{ mt: 2 }}>
          {customizableShiftId && (<RHFTextField name="customId" label="Shift Id" fullWidth />)}

          <Box sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            mt: 1
          }}>
            {eventCheckIn && <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={{ hours: 1, minutes: 15, seconds: 5 }} ampm={false} name="checkInTime" label="Check In" />}
            {eventCheckOut && <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={{ hours: 1, minutes: 15, seconds: 5 }} ampm={false} name="checkOutTime" label="Check Out" />}
          </Box>

          {
            shift?.assignment?.requiredEquipment?.some((eq) => eq?.requiresEquipmentTime) && (
              <Box sx={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
              }}>
                <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={{ hours: 1, minutes: 15, seconds: 5 }} ampm={false} name="checkInEquipmentTime" label="Equipment Check In Time" />
                <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={{ hours: 1, minutes: 15, seconds: 5 }} ampm={false} name="checkOutEquipmentTime" label="Equipment Check Out Time" />
              </Box>
            )
          }

          {
            vehicleCategories && (
              <RHFVehicleCategoriesSelect name="vehicleCategoryId" label='Vehicle Category' />
            )
          }

          {
            (shift?.shiftCheckInOut?.checkInNote || shift?.shiftCheckInOut?.checkOutNote) && (
              <Accordion sx={{
                '&:before': {
                  backgroundColor: 'transparent'
                },
                [`&.${accordionClasses.expanded}`]: {
                  boxShadow: 'none !important',
                  backgroundColor: 'transparent !important',
                }
              }}>
                <AccordionSummary
                  sx={{ pr: 1, pl: 1 }}
                  expandIcon={<Iconify icon="solar:alt-arrow-down-bold" />}
                  aria-controls="officer-notes"
                  id="officer-notes-header"
                >
                  Officer Notes
                </AccordionSummary>
                <AccordionDetails>
                  {shift?.shiftCheckInOut?.checkInNote && <Stack direction="row" spacing={3}>
                    <Typography variant='body1'>Check in:</Typography>
                    <Typography variant='body1'>{shift?.shiftCheckInOut?.checkInNote}</Typography>
                  </Stack>}
                  {shift?.shiftCheckInOut?.checkOutNote && <Stack direction="row" spacing={3}>
                    <Typography variant='body1'>Check out:</Typography>
                    <Typography variant='body1'>{shift?.shiftCheckInOut?.checkOutNote}</Typography>
                  </Stack>}
                </AccordionDetails>
              </Accordion>
            )
          }

          <RHFTextField name="adminNotes" label="Admin Notes" multiline rows={3} fullWidth />
          <Accordion sx={{
            '&:before': {
              backgroundColor: 'transparent'
            },
            [`&.${accordionClasses.expanded}`]: {
              boxShadow: 'none !important',
              backgroundColor: 'transparent !important',
            }
          }}>
            <AccordionSummary
              sx={{ pr: 1, pl: 1 }}
              expandIcon={<Iconify icon="solar:alt-arrow-down-bold" />}
              aria-controls="officer-comments"
              id="officer-comments-header"
            >
              Officer Comments
            </AccordionSummary>
            <AccordionDetails>
              <Stack direction="column" spacing={3}>
                {officerComments.length > 0 ? (
                  officerComments.map(({ id, notes, updatedAt }) => (
                    <TextField
                      key={id}
                      fullWidth
                      multiline
                      rows={2}
                      value={notes}
                      label={`Officer Comment ${convertDate({ date: new Date(updatedAt), user }).format(dateTimeFormat)}`}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No officer comments have been added for this shift.
                  </Typography>
                )}
              </Stack>
            </AccordionDetails>
          </Accordion>

          {
            hasCoordinates && (
              <StyledMapContainer sx={{ mt: 2 }}>
                <MapMarkersPopups
                  {...baseSettings}
                  initialViewState={{
                    zoom: 16,
                    latitude: (shift?.shiftCheckInOut?.checkInCoords?.latitude || shift?.shiftCheckInOut?.checkOutCoords?.latitude) as any,
                    longitude: (shift?.shiftCheckInOut?.checkInCoords?.longitude || shift?.shiftCheckInOut?.checkOutCoords?.longitude) as any,
                  }}
                  data={[
                    ...(shift?.shiftCheckInOut?.checkInCoords?.latitude ? [{
                      name: 'Check In',
                      latitude: (shift?.shiftCheckInOut?.checkInCoords?.latitude) as any,
                      longitude: (shift?.shiftCheckInOut?.checkInCoords?.longitude) as any,
                    }] : []),
                    ...(shift?.shiftCheckInOut?.checkOutCoords?.latitude ? [{
                      name: 'Check Out',
                      latitude: (shift?.shiftCheckInOut?.checkOutCoords?.latitude) as any,
                      longitude: (shift?.shiftCheckInOut?.checkOutCoords?.longitude) as any,
                    }] : []),
                  ]}
                />
              </StyledMapContainer>
            )
          }

          <RHFSwitch name="noShow" label="No Show" />
        </Stack>
      )}
    />
  )
};
