import { useMemo } from "react";
import { capitalize } from "lodash";
// @mui
import LoadingButton from "@mui/lab/LoadingButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
// Components
import { ConfirmDialog } from "src/components/custom-dialog";
// Types
import { ShiftBufferRequest, ShiftBufferRequestStatus } from "src/__generated__/resolvers-types";
import { convertDate } from "src/hooks/use-datejs";
import { useAuthContext } from "src/auth/hooks";
import Iconify from "src/components/iconify";

const statusMap: any = {
  [ShiftBufferRequestStatus.Approved]: 'approve',
  [ShiftBufferRequestStatus.Rejected]: 'deny',
};

export const ShiftBufferRequestConfirm = ({
  editRequest,
  editRequestModal,
  setEditRequest,
  updateRequestLoading,
  handleUpsert,
}: {
  editRequest: {
    buffer: ShiftBufferRequest,
    status: ShiftBufferRequestStatus
    reason: string,
  } | null;
  setEditRequest: (value: any) => void;
  editRequestModal: any;
  updateRequestLoading: boolean;
  handleUpsert: (input: any) => void;
}) => {
  const theme = useTheme();
  const matches = useMediaQuery(theme.breakpoints.up('md'));
  const { user } = useAuthContext();
  const title = useMemo(() => {
    if (editRequest?.status === ShiftBufferRequestStatus.Approved) {
      return 'Approve Shift Buffer';
    }
    return 'Deny Shift Buffer';
  }, [editRequest?.status]);

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
      }).format('ddd DD MMM YYYY HH:mm'),
      endTime: convertDate({
        date: shift.endTime,
        user,
      }).format('ddd DD MMM YYYY HH:mm'),
    };

    const shiftBufferDates = {
      startTime: convertDate({
        date: shiftBuffer.startTime,
        user,
      }).format('ddd DD MMM YYYY HH:mm'),
      endTime: convertDate({
        date: shiftBuffer.endTime,
        user,
      }).format('ddd DD MMM YYYY HH:mm'),
    };
    return (
      <>
        <Typography sx={{ mb: 1 }} variant="body1">{`Are you sure want to ${statusMap[editRequest?.status]} this Shift Buffer Request?`}</Typography>
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
      </>
    )
  }, [editRequest, user, matches]);

  return (
    <ConfirmDialog
      open={editRequestModal.value}
      onClose={editRequestModal.onFalse}
      title={title}
      maxWidth='md'
      content={(
        <>
          {body}
          {editRequest?.status === ShiftBufferRequestStatus.Rejected && (
            <TextField
              label="Denied Reason"
              multiline
              fullWidth
              sx={{ mt: 1 }}
              rows={4}
              onChange={(event) => {
                setEditRequest((c: any) => ({
                  ...c,
                  reason: event.target.value,
                } as any));
              }}
            />
          )}
        </>)}
      action={
        <LoadingButton
          disabled={editRequest?.status === ShiftBufferRequestStatus.Rejected && editRequest?.reason?.trim() === ''}
          loading={updateRequestLoading}
          variant="contained"
          color={editRequest?.status === ShiftBufferRequestStatus.Approved ? "primary" : "error"}
          onClick={handleUpsert}
        >
          {capitalize(statusMap[editRequest?.status || ''])}
        </LoadingButton>
      }
    />
  )
};
