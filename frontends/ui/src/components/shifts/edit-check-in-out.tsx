import { useMemo, useEffect } from 'react';
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
import Button from '@mui/material/Button';
// Components
import { ConfirmDialog } from "src/components/custom-dialog";
import { UseBooleanReturnType } from "src/hooks/use-boolean";
import MapMarkersPopups from 'src/components/map/map-marker-popups';
import FormProvider, {
  RHFDateTimePicker, RHFTextField,
} from 'src/components/hook-form';
// Types
import { Shift } from "src/__generated__/resolvers-types";
import { useAuthContext } from "src/auth/hooks";
import { MAPBOX_API } from 'src/config-global';
import { convertDate } from 'src/hooks/use-datejs';
import { EDIT_CHECK_IN_OUT, GET_GROUPED_SHIFTS } from 'src/api/shifts';
import { useSnackbar } from 'notistack';
import { client } from 'src/utils/apollo';
import Iconify from '../iconify';

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

const THEMES = {
  streets: 'mapbox://styles/mapbox/streets-v11',
  outdoors: 'mapbox://styles/mapbox/outdoors-v11',
  light: 'mapbox://styles/mapbox/light-v10',
  dark: 'mapbox://styles/mapbox/dark-v10',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  satelliteStreets: 'mapbox://styles/mapbox/satellite-streets-v11',
};

const baseSettings = {
  mapboxAccessToken: MAPBOX_API,
  minZoom: 1,
};

export const EditCheckInOut = ({
  shift,
  editCheckInOutModal,
  handleClose,
}: {
  shift: Shift;
  editCheckInOutModal: UseBooleanReturnType;
  handleClose: () => void;
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();

  const [editCheckInOut] = useMutation(EDIT_CHECK_IN_OUT);

  const EditCheckInCheckOut = Yup.object().shape({
    id: Yup.string().required(),
    checkInTime: Yup.date().nullable(),
    checkOutTime: Yup.date().nullable(),
    checkInEquipmentTime: Yup.date().nullable(),
    checkOutEquipmentTime: Yup.date().nullable(),
    checkInNote: Yup.string().nullable(),
    checkOutNote: Yup.string().nullable(),
    adminNotes: Yup.string().nullable(),
  });

  const defaultValues = useMemo(
    () => ({
      id: shift?.id,
      checkInNote: shift?.shiftCheckInOut?.checkInNote,
      checkOutNote: shift?.shiftCheckInOut?.checkOutNote,
      adminNotes: shift?.shiftCheckInOut?.adminNotes,
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
    formState: { isSubmitting, isDirty },
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
        adminNotes: formData.adminNotes,
      }
      if (formData.checkInTime) {
        payload.checkInTime = formData.checkInTime.toISOString();
      }

      if (formData.checkOutTime) {
        payload.checkOutTime = formData.checkOutTime.toISOString();
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

      enqueueSnackbar('Check in/out updated successfully', { variant: 'success', autoHideDuration: 4000 });
      await client.refetchQueries({
        include: [GET_GROUPED_SHIFTS],
      });
      // handleClose();
    } catch(error) {
      enqueueSnackbar('Failed to update check in/out', { variant: 'error', autoHideDuration: 4000 });
    }
  });

  return (
    <ConfirmDialog
      action={null}
      TransitionProps={{
        // wait for animation to end on closing
        onExited: handleClose,
      }}
      open={editCheckInOutModal.value}
      hasCancel={false}
      onClose={handleClose}
      title="Shift Check In/Out"
      maxWidth='md'
      content={(
        <FormProvider methods={methods} onSubmit={onSubmit}>
          <Box sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            mt: 1
          }}>
            <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={{ hours: 1, minutes: 15, seconds: 5 }} ampm={false} sx={{ maxWidth: '300px' }} name="checkInTime" label="Check In" />
            <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={{ hours: 1, minutes: 15, seconds: 5 }} ampm={false} sx={{ maxWidth: '300px' }} name="checkOutTime" label="Check Out" />
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
                <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={{ hours: 1, minutes: 15, seconds: 5 }} ampm={false} sx={{ maxWidth: '300px' }} name="checkInEquipmentTime" label="Equipment Check In Time" />
                <RHFDateTimePicker timezone={user.member.org?.timezone} timeSteps={{ hours: 1, minutes: 15, seconds: 5 }} ampm={false} sx={{ maxWidth: '300px' }} name="checkOutEquipmentTime" label="Equipment Check Out Time" />
              </Box>
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
                  mapStyle={THEMES.dark}
                />
              </StyledMapContainer>
            )
          }

          <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 3, float: 'right' }}>
            <Button
              onClick={handleClose}
              variant='outlined'
            >Close</Button>
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
        </FormProvider>
      )}
    />
  )
};
