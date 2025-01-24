import { useCallback, useState } from 'react';
import { useMutation } from '@apollo/client';
import { capitalize } from "lodash";
// @mui
import Box from '@mui/material/Box';
import LoadingButton from '@mui/lab/LoadingButton';
import red from "@mui/material/colors/red";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// Types
import { FrontendUser, GET_USER, REMOVE_MEMBER_EQUIPMENT, UPSERT_MEMBER_EQUIPMENT } from 'src/api/user';
import { GET_EQUIPMENTS } from 'src/api/equipment';
import { MemberEquipment, EquipmentStatus } from 'src/__generated__/resolvers-types';
import { TableConfig } from 'src/components/table/table-config';
// components
import GQLTable from 'src/components/table/gql/table';
import UpsertMemberEquipment from 'src/components/user/equipment/upsert-equipment-dialoge';
import { ConfirmDialog } from 'src/components/custom-dialog';
import EmptyContent from '../empty-content';

// ----------------------------------------------------------------------

type Props = {
  user: FrontendUser;
  adminViewer: boolean;
  allDisabled?: boolean;
};

export default function AccountEquipments({ user, adminViewer, allDisabled }: Props) {
  const [removeEquipment, { loading: removeLoading }] = useMutation(REMOVE_MEMBER_EQUIPMENT, {
    refetchQueries: [GET_USER],
  })
  const [updateEquipment, { loading: updateEquipmentLoading }] = useMutation(UPSERT_MEMBER_EQUIPMENT, {
    refetchQueries: [GET_USER],
  });

  const [editEquipment, setEditEquipment] = useState<{ memberEquipment: MemberEquipment; status?: EquipmentStatus, reason?: string } | null>(null);
  const deleteConfirm = useBoolean();
  const upsertMemberEquipment = useBoolean();
  const upsertApprovalEquipment = useBoolean();

  const handleUpsert = useCallback(() => {
    setEditEquipment(null);
  }, [setEditEquipment]);

  const handleApprovalUpsert = useCallback(
    async () => {
      try {
        await updateEquipment({
          variables: {
            input: {
              id: editEquipment?.memberEquipment.id,
              status: editEquipment?.status,
              equipmentId: editEquipment?.memberEquipment?.equipment?.id,
              userId: user?.id,
              ...(editEquipment?.status === EquipmentStatus.Denied ? { statusReason: editEquipment.reason } : {}),
            },
          },
        });
        setEditEquipment(null);
        upsertApprovalEquipment.onFalse();
      } catch(error) {
        console.error(error);
      }
    },
    [user, updateEquipment, upsertApprovalEquipment, editEquipment, setEditEquipment]
  );

  const handleDeleteRow = useCallback(() => {
    removeEquipment({
      variables: {
        id: editEquipment!.memberEquipment.id,
      },
    }).then(() => {
      setEditEquipment(null);
      deleteConfirm.onFalse();
    });
  }, [removeEquipment, editEquipment, deleteConfirm, setEditEquipment]);

  const config: TableConfig<MemberEquipment> = {
    header: {
      title: 'Equipment',
      button: {
        text: 'Add Equipment',
        icon: 'ic:baseline-add',
        disabled: allDisabled,
        onClick: () => {
          upsertMemberEquipment.onTrue();
        },
      },
    },
    search: {
      data: (user.member.memberEquipments || []) as MemberEquipment[],
      // This wont be used because data is set :)
      query: GET_EQUIPMENTS,
      processResult: (data) => ({
        total: data.length,
        items: data,
      }),
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        getDisabled: () => !!allDisabled,
        getHidden: (equipment: MemberEquipment) => equipment.status !== EquipmentStatus.Pending,
        onClick: (row: MemberEquipment) => {
          setEditEquipment({ memberEquipment: row });
          upsertMemberEquipment.onTrue();
        },
      },
      {
        getName: () => 'Delete',
        getDisabled: () => !!allDisabled,
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (equipment: MemberEquipment) => {
          setEditEquipment({ memberEquipment: equipment });
          deleteConfirm.onTrue();
        },
      },
      {
        includeDivider: true,
        getName: () => 'Approve',
        getIcon: () => 'solar:check-circle-bold',
        getDisabled: () => !!allDisabled,
        getHidden: (equipment: MemberEquipment) => !adminViewer || equipment.status !== EquipmentStatus.Pending,
        onClick: (equipment: MemberEquipment) => {
          setEditEquipment({
            memberEquipment: equipment,
            status: EquipmentStatus.Approved,
          });
          upsertApprovalEquipment.onTrue();
        },
      },
      {
        getName: () => 'Deny',
        getIcon: () => 'solar:close-circle-bold',
        getColor: (row: MemberEquipment) => red[500],
        getDisabled: () => !!allDisabled,
        getHidden: (equipment: MemberEquipment) => !adminViewer || equipment.status !== EquipmentStatus.Pending,
        onClick: (equipment: MemberEquipment) => {
          setEditEquipment({
            memberEquipment: equipment,
            status: EquipmentStatus.Denied,
          });
          upsertApprovalEquipment.onTrue();
        },
      },
    ],
    columns: [
      { id: 'equipment.name', label: 'Name', columnType: 'string' },
      {
        id: 'status',
        label: 'Status',
        width: 110,
        columnType: 'string',
        renderValue: (status) => capitalize(status),
        getLabelColor: (row) => {
          switch (row.status) {
            case EquipmentStatus.Approved:
              return 'success';
            case EquipmentStatus.Denied:
              return 'error';
            case EquipmentStatus.Pending:
              return 'warning';
            default:
              return 'default';
          }
        },
      },
      { id: 'createdAt', label: 'Create at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [],
  };

  if (!user.member?.rank?.id) {
    return (
      <EmptyContent
        filled
        title='Rank Not Found'
        description='A Rank is required to manage Equipment. Please assign a Rank to this User.'
      />
    );
  }

  return (
    <Box width="100%">
      <GQLTable config={config} />

      <UpsertMemberEquipment
        memberEquipment={editEquipment?.memberEquipment || null}
        userId={user.id}
        upsertMemberEquipment={upsertMemberEquipment}
        onUpsertMemberEquipment={handleUpsert}
        existingEquipment={(user.member.memberEquipments || []) as MemberEquipment[]}
      />

      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <LoadingButton loading={removeLoading} variant="contained" color="error" onClick={handleDeleteRow}>
            Delete
          </LoadingButton>
        }
      />

      <ConfirmDialog
        open={upsertApprovalEquipment.value}
        onClose={upsertApprovalEquipment.onFalse}
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
          <LoadingButton disabled={(editEquipment?.status === EquipmentStatus.Denied && (editEquipment?.reason?.trim() === '' || !editEquipment?.reason))} loading={updateEquipmentLoading} variant="contained" color={editEquipment?.status === EquipmentStatus.Approved ? "primary" : "error"} onClick={handleApprovalUpsert}>
            {editEquipment?.status === EquipmentStatus.Approved ? 'Approve' : 'Deny'}
          </LoadingButton>
        }
      />
    </Box>
  );
}
