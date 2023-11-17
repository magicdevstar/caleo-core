import { useCallback, useState } from "react";
// @apollo/client
import { useMutation } from "@apollo/client";
// @mui
import Button from "@mui/material/Button";
// Types
import { ShiftBufferRequest, ShiftBufferRequestStatus } from "src/__generated__/resolvers-types";
import { GET_SHIFT_BUFFER_REQUESTS, SET_SHIFT_BUFFER_STATUS } from "src/api/shifts";
import GQLTable from "src/components/table/gql/table"
// Hooks
import { useBoolean } from "src/hooks/use-boolean";
// Components
import { TableConfig } from "src/components/table/table-config";
import { ShiftBufferRequestConfirm } from "./shift-buffer-request-confirm";

export default function ShiftBufferRequestsTable() {
  const [updateRequest, { loading: updateRequestLoading }] = useMutation(SET_SHIFT_BUFFER_STATUS, {
    refetchQueries: [GET_SHIFT_BUFFER_REQUESTS],
  });
  const [editRequest, setEditRequest] = useState<{
    buffer: ShiftBufferRequest,
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
    rowActions: [],
    columns: [
      { id: 'user.name', label: 'Name', columnType: 'string' },
      { id: 'note', label: 'Note', columnType: 'string' },
      { id: 'createdAt', label: 'Create at', width: 160, columnType: 'date' },
      {
        id: '',
        width: 88,
        columnType: 'action',
        label: '',
        renderValue: (_value: any, _index: number, row: ShiftBufferRequest) => (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setEditRequest({
                buffer: row,
                reason: '',
              });
              editRequestModal.onTrue();
            }}
          >View</Button>
        ),
      },
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
    async (status: ShiftBufferRequestStatus) => {
      try {
        await updateRequest({
          variables: {
            id: editRequest?.buffer.id,
            status,
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

