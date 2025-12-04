import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@apollo/client';
// @mui
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles/createTheme';
// hooks
import { useFeatures } from 'src/hooks/use-features';
import { useBoolean } from 'src/hooks/use-boolean';
// components
import Iconify from 'src/components/iconify';
import PolygonDrawMap from 'src/components/map/map-polygon';
import { ConfirmDialog } from 'src/components/custom-dialog';
// types
import { Shift } from 'src/__generated__/resolvers-types';
import { ADD_SHIFT_COMMENT } from 'src/api/shifts';
import LoadingButton from '@mui/lab/LoadingButton';
import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export type CheckInOutItemProps = {
  shift: Shift;
  mapSx?: SxProps<Theme>;
  onClick: (shift: Shift) => void;
  ignoreGeoFence?: boolean;
  fromSelfCheckout: boolean;
};

const NOT_DEMOBILIZED_MESSAGE = "You are not cleared to check out at this time. Please wait until you have been demobilized. If you have already been demobilized, contact the Command Post to update your status.";

export default function CheckInOutItem({ shift, mapSx, onClick, ignoreGeoFence, fromSelfCheckout }: CheckInOutItemProps) {
  const { user } = useAuthContext();
  const { eventCheckIn, lasdEventFields } = useFeatures();
  const addCommentDialog = useBoolean();
  const [comment, setComment] = useState('');
  const canCheckout = useMemo(() => {
    if (!lasdEventFields) return true;
    const bypassDemob = shift.event.bypassDemobilization || shift.assignment.bypassDemobilization || shift.bypassDemobilization;
    if (bypassDemob) return true;
    return !!shift.demobilizedTime;
  }, [shift, lasdEventFields]);
  const [addComment, { loading: addingCommentLoading }] = useMutation(ADD_SHIFT_COMMENT);
  const geoDetails = useMemo(() => {
    const coords = [
      (shift.assignment?.allowOfficerCheckIn ? shift.assignment?.geoFence : undefined),
      (shift.event?.allowOfficerCheckIn ? shift.event?.geoFence : undefined),
    ].filter(Boolean);
    const requiresSpecificLocation = shift.assignment?.allowOfficerCheckIn || shift.event?.allowOfficerCheckIn;

    return {
      coords,
      requiresSpecificLocation,
    };
  }, [shift]);
  const isCheckOut = shift.shiftCheckInOut?.checkInTime || !eventCheckIn;

  const submitComment = useCallback(async () => {
    try {
      await addComment({
        variables: {
          input: {
            id: shift.id,
            shiftId: shift.id,
            userId: user.id,
            comment,
          },
        },
      });
      setComment('');
      addCommentDialog.onFalse();
    } catch(error) {
      console.error('Error submitting comment:', error);
    }
  }, [addCommentDialog, comment, shift, user, addComment]);

  const action = (
    <Stack spacing={1}>
      <Stack spacing={1} direction="row">
        <Tooltip title={(isCheckOut && !canCheckout) ? NOT_DEMOBILIZED_MESSAGE : ""}>
          <span>
            <Button
              disabled={!!(isCheckOut && !canCheckout)}
              onClick={() => {
                onClick?.(shift);
              }}
              size="small"
              variant="contained"
            >
              {isCheckOut ? 'Check Out' : 'Check In'}
            </Button>
          </span>
        </Tooltip>
        {!isCheckOut && (<Button size="small" variant="outlined" onClick={addCommentDialog.onTrue}>Contact</Button>)}
      </Stack>
      <Typography variant='caption' color="textSecondary" component="p">You can remotely check in/out now! Your location will be shared to confirm you’re within the check-in/out boundaries.</Typography>
    </Stack>
  );

  return (
    <Stack
      spacing={2}
      sx={{
        mt: 1,
        p: 3,
        position: 'relative',
        minHeight: 220,
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'background.neutral',
            }}
          >
            {isCheckOut ? <Iconify icon="solar:logout-2-bold-duotone" /> : <Iconify icon="solar:login-2-bold-duotone" />}
          </Stack>

          <ListItemText
            primary={`${isCheckOut ? 'Check Out' : 'Check In'}: ${shift?.event?.name}`}
            secondary={shift?.assignment?.name}
            secondaryTypographyProps={{
              component: 'span',
              typography: 'caption',
              mt: 0.5,
              color: 'text.disabled',
            }}
          />
        </Stack>

        {
          geoDetails.requiresSpecificLocation && !ignoreGeoFence ? (
            <PolygonDrawMap
              initialPolygons={geoDetails.coords as [number, number][][]}
              disabled
              hideAttributionControl
              sx={mapSx || { height: 100, mt: 1 }}
            />
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ m: 0 }}>
              Are you ready to {isCheckOut ? 'check out' : 'check in'} of {shift?.event?.name} - {shift?.assignment?.name}
            </Typography>
          )
        }
      </Box>

      {action}

      <ConfirmDialog
        open={addCommentDialog.value}
        onClose={addCommentDialog.onFalse}
        title="Add Comment"
        content={(
          <Stack spacing={2}>
            <Typography variant="body2">Please add your comment:</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={addingCommentLoading}
            />
          </Stack>
        )}
        action={
          <LoadingButton loading={addingCommentLoading} variant="contained" onClick={submitComment}>
            Submit Comment
          </LoadingButton>
        }
      />
    </Stack>
  );
}
