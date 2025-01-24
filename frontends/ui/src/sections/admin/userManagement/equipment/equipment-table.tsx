import { useCallback, useState } from "react";
// @apollo/client
import { useMutation } from "@apollo/client";

// @mui
import LoadingButton from "@mui/lab/LoadingButton";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import red from "@mui/material/colors/red";

// Types
import { MemberEquipment, EquipmentStatus } from "src/__generated__/resolvers-types";
import { GET_MEMBER_EQUIPMENTS } from "src/api/equipment";
import { UPSERT_MEMBER_EQUIPMENT } from "src/api/user";
import GQLTable from "src/components/table/gql/table"
// Hooks
import { useBoolean } from "src/hooks/use-boolean";
// Components
import { ConfirmDialog } from "src/components/custom-dialog";
import { TableConfig } from "src/components/table/table-config"

export default function EquipmentTable() {
  const [updateEquipment, { loading: updateEquipmentLoading }] = useMutation(UPSERT_MEMBER_EQUIPMENT, {
    refetchQueries: [GET_MEMBER_EQUIPMENTS],
  });

  const [editEquipment, setEditEquipment] = useState<{ memberEquipment: MemberEquipment; status: EquipmentStatus, reason?: string } | null>(null);
  const upsertEquipment = useBoolean();

  const config: TableConfig<MemberEquipment> = {
    header: {
      title: 'Equipment Requests',
    },
    search: {
      defaultTableConfig: {
        defaultRowsPerPage: 10,
      },
      query: GET_MEMBER_EQUIPMENTS,
      processResult: (data) => {
        const { memberEquipments: { items, total } } = data || { memberEquipments: { items: [], total: 0 } };
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
        onClick: (row: MemberEquipment) => {
          setEditEquipment({
            memberEquipment: row,
            status: EquipmentStatus.Approved,
          });
          upsertEquipment.onTrue();
        },
      },
      {
        getName: () => 'Deny',
        getIcon: () => 'solar:close-circle-bold',
        getColor: (row: MemberEquipment) => red[500],
        onClick: (row: MemberEquipment) => {
          setEditEquipment({
            memberEquipment: row,
            status: EquipmentStatus.Denied,
          });
          upsertEquipment.onTrue();
        },
      }
    ],
    columns: [
      { id: 'user.name', label: 'Name', columnType: 'string' },
      { id: 'equipment.name', label: 'Equipment', columnType: 'string' },
      {
        id: 'image',
        label: 'Attachment',
        columnType: 'string',
        clickable: (row: MemberEquipment) => !!row?.image,
        renderValue: (image: string) => image ? 'View Attachment' : '-',
        getLabelColor: (row: MemberEquipment) => row?.image ? 'info' : 'default',
        onClick: (row: MemberEquipment) => {
          if (row.image) {
            window.open(row.image, '_blank');
          }
        }
      },
      { id: 'createdAt', label: 'Create at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
      {
        id: 'status',
        type: 'hidden',
        label: 'Cert Required',
        defaultValue: EquipmentStatus.Pending,
        value: EquipmentStatus.Pending,
      }
    ]
  };

  const handleUpsert = useCallback(
    async () => {
      try {
        await updateEquipment({
          variables: {
            input: {
              id: editEquipment?.memberEquipment.id,
              status: editEquipment?.status,
              equipmentId: editEquipment?.memberEquipment?.equipment?.id,
              userId: editEquipment?.memberEquipment?.user?.id,
              ...(editEquipment?.status === EquipmentStatus.Denied ? { statusReason: editEquipment.reason } : {}),
            },
          },
        });
        setEditEquipment(null);
        upsertEquipment.onFalse();
      } catch(error) {
        console.error(error);
      }
    },
    [updateEquipment, upsertEquipment, editEquipment, setEditEquipment]
  );

  return (
    <>
      <GQLTable config={config} />

      <ConfirmDialog
        open={upsertEquipment.value}
        onClose={upsertEquipment.onFalse}
        title={editEquipment?.status === EquipmentStatus.Approved ? 'Approve Equipment' : 'Deny Equipment'}
        content={(
          <>
            <Typography variant="body1">{`Are you sure want to ${editEquipment?.status?.toLowerCase()} this equipment?`}</Typography>
            {editEquipment?.status === EquipmentStatus.Denied && (
              <TextField
                label="Denied Reason"
                multiline
                fullWidth
                sx={{ mt: 1 }}
                rows={4}
                onChange={(event) => {
                  setEditEquipment((c) => ({
                    ...c,
                    reason: event.target.value,
                  } as any))
                }}
              />
            )}
          </>)}
        action={
          <LoadingButton disabled={(editEquipment?.status === EquipmentStatus.Denied && (editEquipment?.reason?.trim() === '' || !editEquipment?.reason))} loading={updateEquipmentLoading} variant="contained" color={editEquipment?.status === EquipmentStatus.Approved ? "primary" : "error"} onClick={handleUpsert}>
            {editEquipment?.status === EquipmentStatus.Approved ? 'Approve' : 'Deny'}
          </LoadingButton>
        }
      />
    </>
  )
};

