import { useMemo } from "react";
// @mui
import LoadingButton from "@mui/lab/LoadingButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
// hooks
import { useWeeklyShifts } from "src/hooks/use-weekly-shift-count";
import { useAuthContext } from "src/auth/hooks";
import { convertDate, dateTimeFormat } from "src/hooks/use-datejs";
// Types
import { ShiftBufferRequest, ShiftBufferRequestStatus } from "src/__generated__/resolvers-types";
// Components
import Iconify from "src/components/iconify";
import { ConfirmDialog } from "src/components/custom-dialog";

export const ShiftBufferRequestConfirm = ({
  editRequest,
  editRequestModal,
  setEditRequest,
  updateRequestLoading,
  handleUpsert,
  handleClose,
}: {
  editRequest: {
    buffer: ShiftBufferRequest,
    reason: string,
  } | null;
  setEditRequest: (value: any) => void;
  editRequestModal: any;
  updateRequestLoading: boolean;
  handleUpsert: (input: any) => void;
  handleClose: (node: HTMLElement) => void;
}) => {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const { user } = useAuthContext();

  const { weeklyShifts, loading: loadingWeeklyShifts, error: weeklyShiftsError } = useWeeklyShifts({
    userId: editRequest?.buffer?.user?.id,
    date: editRequest?.buffer?.startTime,
  });

  const shiftUser = useMemo(() => editRequest?.buffer?.user, [editRequest]);

  const body = useMemo(() => {
    if (!editRequest?.buffer) {
      return (<Typography variant="body1">No data</Typography>);
    }
    const shift = editRequest?.buffer?.shift;
    const shiftBuffer = editRequest?.buffer?.shiftBufferShift;
    const shiftDates = {
      startTime: convertDate({
        date: shift.startTime,
        user,
      }).format(dateTimeFormat),
      endTime: convertDate({
        date: shift.endTime,
        user,
      }).format(dateTimeFormat),
    };

    const shiftBufferDates = {
      startTime: convertDate({
        date: shiftBuffer.startTime,
        user,
      }).format(dateTimeFormat),
      endTime: convertDate({
        date: shiftBuffer.endTime,
        user,
      }).format(dateTimeFormat),
    };
    return (
      <Box sx={{
        borderRadius: '5px',
        padding: '5px 5px 10px 5px',
        background: 'rgba(0,0,0,0.3)',
        marginTop: '10px',
        p: 2,
        mb: 1,
      }}>
        <Box sx={{
          display: 'flex',
          gap: '10px',
          flexDirection: {
            xs: 'column',
            sm: 'column',
            md: 'row',
          },
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}>
          <Box>
            <Typography sx={{ mb: 1, fontWeight: 'bold' }} variant="body1">Conflicting Shift</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>(#{editRequest?.buffer?.shiftBufferShift?.event?.referenceId}) {editRequest?.buffer?.shiftBufferShift?.event?.name} - {editRequest?.buffer?.shiftBufferShift?.assignment?.name}</Typography>
            <Typography variant="caption">{shiftBufferDates.startTime} - {shiftBufferDates.endTime}</Typography>
          </Box>
          <Iconify icon={matches ? "ic:baseline-arrow-forward" : "ic:baseline-arrow-downward"} />
          <Box>
            <Typography sx={{ mb: 1, fontWeight: 'bold' }} variant="body1">Requested Shift</Typography>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>(#{editRequest?.buffer?.event?.referenceId}) {editRequest?.buffer?.event?.name} - {editRequest?.buffer?.assignment?.name}</Typography>
            <Typography variant="caption">{shiftDates.startTime} - {shiftDates.endTime}</Typography>
          </Box>
        </Box>
        <Typography sx={{
          mb: 1,
          textAlign: {
            xs: 'center',
            sm: 'center',
            md: 'left',
          },
        }} variant="body1">Reason for request: {editRequest?.buffer?.note}</Typography>
      </Box>
    )
  }, [editRequest, user, matches]);

  return (
    <ConfirmDialog
      TransitionProps={{
        // wait for animation to end on closing
        onExited: handleClose
      }}
      open={editRequestModal.value}
      onClose={() => {
        editRequestModal.onFalse();
      }}
      title="Buffer request details"
      maxWidth='md'
      content={(
        <>
          {body}
          <TextField
            label="Denied Reason"
            multiline
            fullWidth
            helperText="Please enter a reason if you would like to deny this request."
            sx={{ mt: 1 }}
            rows={4}
            onChange={(event) => {
              setEditRequest((c: any) => ({
                ...c,
                reason: event.target.value,
              } as any));
            }}
          />
          {
            shiftUser &&
            ((weeklyShifts?.length || 0) >= (shiftUser?.member?.maxShifts || user?.member?.org?.settings?.shiftsPerWeek || Number.POSITIVE_INFINITY)) &&
            !weeklyShiftsError &&
            !loadingWeeklyShifts && (
              <Typography variant='body2' color="warning.main" sx={{ mt: 2, ml: 1 }}>
                { `Warning: ${shiftUser?.name} has reached their max shift limit for this shift week.` }
              </Typography>
            )
          }
          {shiftUser && weeklyShiftsError && !loadingWeeklyShifts && (
            <Typography variant='body2' color="error.main" sx={{ mt: 2, ml: 1 }}>
              { `Error retrieving user weekly shift count. User's shift count for this shift week is unknown. Proceed with caution.` }
            </Typography>
          )}
        </>)}
      action={
        <Stack direction="row" spacing={2} sx={{ mr: 2 }}>
          <LoadingButton
            disabled={editRequest?.reason?.trim() === ''}
            loading={updateRequestLoading || loadingWeeklyShifts}
            variant="contained"
            color="error"
            onClick={() => handleUpsert(ShiftBufferRequestStatus.Rejected)}
          >
            Deny
          </LoadingButton>
          <LoadingButton
            loading={updateRequestLoading || loadingWeeklyShifts}
            variant="contained"
            color="primary"
            onClick={() => handleUpsert(ShiftBufferRequestStatus.Approved)}
          >
            Approve
          </LoadingButton>
        </Stack>
      }
    />
  )
};
