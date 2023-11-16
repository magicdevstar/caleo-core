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
import { ShiftBufferRequestConfirm } from "./shift-buffer-request-confirm";

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

      <ShiftBufferRequestConfirm
        editRequest={editRequest}
        editRequestModal={editRequestModal}
        setEditRequest={setEditRequest}
        updateRequestLoading={updateRequestLoading}
        handleUpsert={handleUpsert}
      />
    </>
  )
};

