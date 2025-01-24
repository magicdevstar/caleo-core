import { useCallback, useState } from "react";

// @apollo/client
import { useMutation } from "@apollo/client";

// @mui
import Button from '@mui/material/Button';

// Types
import { Equipment } from "src/__generated__/resolvers-types";
import { GET_EQUIPMENTS, REMOVE_EQUIPMENT, UPSERT_EQUIPMENT } from "src/api/equipment";
import GQLTable from "src/components/table/gql/table"
// Hooks
import { useBoolean } from "src/hooks/use-boolean";
// Components
import { ConfirmDialog } from "src/components/custom-dialog";
import { TableConfig, getBooleanFilters } from "src/components/table/table-config"

import UpsertEquipmentDialogue from "./upsert-equipment-dialogue";

export default function EquipmentTable() {
  const [updateEquipment] = useMutation(UPSERT_EQUIPMENT, {
    refetchQueries: [GET_EQUIPMENTS],
  });

  const [removeEquipment] = useMutation(REMOVE_EQUIPMENT, {
    refetchQueries: [GET_EQUIPMENTS],
  });

  const [editEquipment, setEditEquipment] = useState<Equipment | null>(null);
  const deleteConfirm = useBoolean();
  const upsertEquipment = useBoolean();

  const config: TableConfig<Equipment> = {
    header: {
      title: 'Equipment',
      button: {
        text: 'Add Equipment',
        icon: 'ic:baseline-add',
        onClick: () => {
          upsertEquipment.onTrue();
        },
      }
    },
    search: {
      query: GET_EQUIPMENTS,
      processResult: (data) => {
        const { equipments: { items, total } } = data || { equipments: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      }
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Equipment) => {
          setEditEquipment(row);
          upsertEquipment.onTrue();
        },
      },
      {
        getName: (row: Equipment) => row.active ? 'Deactivate' : 'Activate',
        getIcon: (row: Equipment) => row.active ? 'solar:close-circle-bold' : 'solar:check-circle-bold',
        onClick: async (equipment: Equipment) => {
          updateEquipment({
            variables: {
              input: {
                id: equipment.id,
                active: !equipment.active,
                name: equipment.name,
                requiresCert: equipment.requiresCert,
                requiresAdminApproval: equipment.requiresAdminApproval,
              },
            },
          });
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (equipment: Equipment) => {
          setEditEquipment(equipment);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      { id: 'name', label: 'Equipment', columnType: 'string' },
      { id: 'requiresCert', label: 'Cert Required', width: 160, columnType: 'boolean' },
      { id: 'requiresAdminApproval', label: 'Admin Approval', width: 160, columnType: 'boolean' },
      { id: 'active', label: 'Active', width: 110, columnType: 'boolean' },
      { id: 'createdAt', label: 'Create at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
      {
        id: 'requiresCert',
        type: 'select',
        label: 'Cert Required',
        defaultValue: [],
        value: [],
        fetchOptions: getBooleanFilters,
        resolveAsBoolean: true,
      },
      {
        id: 'requiresAdminApproval',
        type: 'select',
        label: 'Admin Approval',
        defaultValue: [],
        value: [],
        fetchOptions: getBooleanFilters,
        resolveAsBoolean: true,
      },
      {
        id: 'active',
        type: 'select',
        label: 'Active',
        defaultValue: [],
        value: [],
        fetchOptions: getBooleanFilters,
        resolveAsBoolean: true,
      },
      {
        id: 'query',
        type: 'text',
        label: 'Search',
        defaultValue: '',
        value: '',
      },
    ]
  };

  const handleUpsert = useCallback(
    () => {
      setEditEquipment(null);
    },
    []
  );

  const handleDeleteRow = useCallback(
    () => {
      removeEquipment({
        variables: {
          id: editEquipment?.id,
        },
      }).then(() => {
        setEditEquipment(null);
        deleteConfirm.onFalse();
      });
    },
    [removeEquipment, editEquipment, setEditEquipment, deleteConfirm]
  );

  return (
    <>
      <GQLTable config={config} />

      <UpsertEquipmentDialogue
        upsertEquipment={upsertEquipment}
        equipment={editEquipment}
        onUpsertEquipment={handleUpsert}
      />
      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  )
};

