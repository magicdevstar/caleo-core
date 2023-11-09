import { useCallback, useState } from "react";
import { capitalize } from "lodash";
// @apollo/client
import { useMutation } from "@apollo/client";

// @mui
import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import red from "@mui/material/colors/red";

// Types
import { ShiftBufferRequest, ShiftBufferRequestStatus } from "src/__generated__/resolvers-types";
import { GET_SHIFT_BUFFER_REQUESTS, SET_SHIFT_BUFFER_STATUS } from "src/api/shifts";
import GQLTable from "src/components/table/gql/table"
// Hooks
import { useBoolean } from "src/hooks/use-boolean";
// Components
import { ConfirmDialog } from "src/components/custom-dialog";
import { TableConfig } from "src/components/table/table-config"

export default function ShiftBufferRequestsTable() {
  const [updateRequest, { loading: updateRequestLoading }] = useMutation(SET_SHIFT_BUFFER_STATUS, {
    refetchQueries: [GET_SHIFT_BUFFER_REQUESTS],
  });
  const [editRequest, setEditRequest] = useState<{
    buffer: ShiftBufferRequest,
    status: ShiftBufferRequestStatus
    reason: string,
  } | null>(null);
  const editRequestModal = useBoolean();

  const config: TableConfig<ShiftBufferRequest> = {
    header: {
      title: 'Shift Buffer Requests',
    },
    search: {
      defaultTableConfig: {
        defaultRowsPerPage: 10,
      },
      query: GET_SHIFT_BUFFER_REQUESTS,
      processResult: (data) => {
        const { shiftBufferRequests: { items, total } } = data || { shiftBufferRequests: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      }
    },
    rowActions: [
      {
        getName: () => 'Approve',
        getIcon: () => 'solar:check-circle-bold',
        onClick: (row: ShiftBufferRequest) => {
          setEditRequest({
            buffer: row,
            status: ShiftBufferRequestStatus.Approved,
            reason: '',
          });
          editRequestModal.onTrue();
        },
      },
      {
        getName: () => 'Deny',
        getIcon: () => 'solar:close-circle-bold',
        getColor: () => red[500],
        onClick: (row: ShiftBufferRequest) => {
          setEditRequest({
            buffer: row,
            status: ShiftBufferRequestStatus.Rejected,
            reason: '',
          });
          editRequestModal.onTrue();
        },
      }
    ],
    columns: [
      { id: 'user.name', label: 'Name', columnType: 'string' },
      { id: 'note', label: 'Note', columnType: 'string' },
      { id: 'createdAt', label: 'Create at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
      {
        id: 'status',
        type: 'hidden',
        label: 'status',
        defaultValue: ShiftBufferRequestStatus.Pending,
        value: ShiftBufferRequestStatus.Pending,
      }
    ],
  };

  const handleUpsert = useCallback(
    async () => {
      try {
        await updateRequest({
          variables: {
            id: editRequest?.buffer.id,
            status: editRequest?.status,
            reason: editRequest?.reason,
          },
        });
        setEditRequest(null);
        editRequestModal.onFalse();
      } catch(error) {
        console.error(error);
      }
    },
    [updateRequest, editRequestModal, editRequest, setEditRequest]
  );

  return (
    <>
      <GQLTable config={config} />

      <ConfirmDialog
        open={editRequestModal.value}
        onClose={editRequestModal.onFalse}
        title={editRequest?.status === ShiftBufferRequestStatus.Approved ? 'Approve Shift Buffer' : 'Deny Shift Buffer'}
        content={(
          <>
            <Typography variant="body1">{`Are you sure want to ${editRequest?.status?.toLowerCase()} this Shift Buffer Request?`}</Typography>
            {editRequest?.status === ShiftBufferRequestStatus.Rejected && (
              <TextField
                label="Denied Reason"
                multiline
                fullWidth
                sx={{ mt: 1 }}
                rows={4}
                onChange={(event) => {
                  setEditRequest((c) => ({
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
            {capitalize(editRequest?.status)}
          </LoadingButton>
        }
      />
    </>
  )
};

