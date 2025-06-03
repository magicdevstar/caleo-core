import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation } from "@apollo/client/react/hooks/useMutation";
// @mui
import LoadingButton from "@mui/lab/LoadingButton";
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
// types
import { GET_EVENT } from "src/api/event";
import { GET_GROUPED_SHIFTS, UPSERT_SHIFTS } from "src/api/shifts";
import { GET_ASSIGNMENT } from "src/api/assignment";
import { Shift } from "src/__generated__/resolvers-types";
import { UseBooleanReturnType } from "src/hooks/use-boolean";
// Components
import { ConfirmDialog } from "../custom-dialog";

interface IProps {
  controller: UseBooleanReturnType<Shift | null>;
}

export const EditShiftIdModel = ({
  controller,
}: IProps) => {
  const shift = useMemo(() => controller.attribute, [controller.attribute]);
  const [customId, setCustomId] = useState<string>(shift?.customId || '');

  useEffect(() => {
    setCustomId(shift?.customId || '');
  }, [shift]);
  
  const [upsertShifts, { loading }] = useMutation(UPSERT_SHIFTS, {
    refetchQueries: [{
      query: GET_EVENT,
      variables: {
        id: controller.attribute?.eventId,
      }
    }, {
      query: GET_ASSIGNMENT,
      variables: {
        id: controller.attribute?.assignmentId,
      }
    }, GET_GROUPED_SHIFTS],
  });

  const handleSave = useCallback(async () => {
    const s = shift!;
    await upsertShifts({
      variables: {
        input: [
          {
            id: s.id,
            customId,
            refNumber: s.refNumber,
            startTime: s.startTime,
            endTime: s.endTime,
            assignmentId: s.assignment.id,
            eventId: s.event.id,
            status: s.status,
            shiftId: s.shiftId,
            locked: s.locked,
          },
        ],
      }
    });
    controller.onFalse();
  }, [shift, controller, upsertShifts, customId]);

  return (
    <ConfirmDialog
      open={controller.value}
      onClose={controller.onFalse}
      title="Update Shift Slot Id"
      content={(
        <Box sx={{ p: 1, minWidth: 300 }}>
          <TextField
            fullWidth
            label="Shift ID"
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            margin="normal"
            autoFocus
          />
        </Box>
      )}
      action={
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={loading}
        >
          Save
        </LoadingButton>
      }
    />
  );
};