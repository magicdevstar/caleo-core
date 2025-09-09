import { useMemo, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useMutation } from '@apollo/client';
import * as Yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
// @mui
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import LoadingButton from "@mui/lab/LoadingButton";
import Stack from "@mui/material/Stack";
import Accordion, { accordionClasses } from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography';
// Components
import { UseBooleanReturnType } from "src/hooks/use-boolean";
import MapMarkersPopups from 'src/components/map/map-marker-popups';
import {
  RHFDateTimePicker, RHFSwitch, RHFTextField,
} from 'src/components/hook-form';
import { useFeatures } from 'src/hooks/use-features';
// Types
import { Shift } from "src/__generated__/resolvers-types";
import { useAuthContext } from "src/auth/hooks";
import { convertDate } from 'src/hooks/use-datejs';
import { EDIT_CHECK_IN_OUT } from 'src/api/shifts';
import Iconify from '../iconify';
import { RHFVehicleCategoriesSelect } from '../hook-form/rhf-vehicle-categories-select';
import ConfirmDialogWithForm from '../custom-dialog/confirm-dialog-with-form';

const StyledMapContainer = styled('div')(({ theme }) => ({
  zIndex: 0,
  height: 400,
  overflow: 'hidden',
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  '& .mapboxgl-ctrl-logo, .mapboxgl-ctrl-bottom-right': {
    display: 'none',
  },
}));

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
      })

      enqueueSnackbar('Shift details updated successfully', { variant: 'success', autoHideDuration: 4000 });
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
        <LoadingButton
          type="submit"
          disabled={!isDirty}
          loading={isSubmitting}
          variant="contained"
          color="primary"
        >
          Save
        </LoadingButton>
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
        <>
          {customizableShiftId && (<RHFTextField name="customId" label="Shift Id" fullWidth sx={{ mt: 1, mb: 2 }} />)}

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
                mt: 3,
              }}>
                <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={{ hours: 1, minutes: 15, seconds: 5 }} ampm={false} name="checkInEquipmentTime" label="Equipment Check In Time" />
                <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={{ hours: 1, minutes: 15, seconds: 5 }} ampm={false} name="checkOutEquipmentTime" label="Equipment Check Out Time" />
              </Box>
            )
          }

          {
            vehicleCategories && (
              <RHFVehicleCategoriesSelect sx={{ mt: 2 }} name="vehicleCategoryId" label='Vehicle Category' />
            )
          }

          {
            (shift?.shiftCheckInOut?.checkInNote || shift?.shiftCheckInOut?.checkOutNote) && (
              <Accordion sx={{
                mt: 1,
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

          <RHFTextField sx={{ mt: 2 }} name="adminNotes" label="Admin Notes" multiline rows={3} fullWidth />
          <RHFSwitch name="noShow" label="No Show" />

          {
            hasCoordinates && (
              <StyledMapContainer sx={{ mt: 2 }}>
                <MapMarkersPopups
                  {...baseSettings}
                  initialViewState={{
                    zoom: 16,
                    latitude: shift?.shiftCheckInOut?.checkInCoords?.latitude || shift?.shiftCheckInOut?.checkOutCoords?.latitude,
                    longitude: shift?.shiftCheckInOut?.checkInCoords?.longitude || shift?.shiftCheckInOut?.checkOutCoords?.longitude,
                  }}
                  data={[
                    ...(shift?.shiftCheckInOut?.checkInCoords?.latitude ? [{
                      name: 'Check In',
                      latitude: shift?.shiftCheckInOut?.checkInCoords?.latitude,
                      longitude: shift?.shiftCheckInOut?.checkInCoords?.longitude,
                    }] : []),
                    ...(shift?.shiftCheckInOut?.checkOutCoords?.latitude ? [{
                      name: 'Check Out',
                      latitude: shift?.shiftCheckInOut?.checkOutCoords?.latitude,
                      longitude: shift?.shiftCheckInOut?.checkOutCoords?.longitude,
                    }] : []),
                  ]}
                />
              </StyledMapContainer>
            )
          }
        </>
      )}
    />
  )
};
