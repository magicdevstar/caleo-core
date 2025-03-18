import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
// @mui
import Button from '@mui/material/Button';
// @apollo/client
import { useMutation } from '@apollo/client';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
// types
import { Unit } from 'src/__generated__/resolvers-types';
import { GET_UNITS, REMOVE_UNIT, UPSERT_UNIT } from 'src/api/unit';
import { getBooleanFilters, TableConfig } from 'src/components/table/table-config';
//
import UpsertUnitDialogue from './upsert-unit-dialogue';

// ----------------------------------------------------------------------

export default function UnitTable() {
  const { enqueueSnackbar } = useSnackbar();
  const [updateUnit] = useMutation(UPSERT_UNIT, {
    refetchQueries: [GET_UNITS],
  });

  const [removeUnit] = useMutation(REMOVE_UNIT, {
    refetchQueries: [GET_UNITS],
    onError: (error) => {
      enqueueSnackbar(error.message, { variant: 'error', autoHideDuration: 4000 });
    }
  });

  const [editUnit, setEditUnit] = useState<Unit | null>(null);
  const deleteConfirm = useBoolean();
  const upsertUnit = useBoolean();

  const config: TableConfig<Unit> = {
    header: {
      title: 'Unit of Assignment',
      button: {
        text: 'Add Unit',
        icon: 'ic:baseline-add',
        onClick: () => {
          upsertUnit.onTrue();
        },
      }
    },
    search: {
      query: GET_UNITS,
      processResult: (data: any) => {
        if (!data?.units) {
          return {
            items: [],
            total: 0,
          };
        }
        const { units: { items, total } } = data || { units: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      }
    },
    table: {
      toolbar: {
        lg: 6,
      }
    },
    rowActions: [
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Unit) => {
          setEditUnit(row);
          upsertUnit.onTrue();
        },
      },
      {
        getName: (row: Unit) => row.active ? 'Deactivate' : 'Activate',
        getIcon: (row: Unit) => row.active ? 'solar:close-circle-bold' : 'solar:check-circle-bold',
        onClick: async (unit: Unit) => {
          updateUnit({
            variables: {
              input: {
                id: unit.id,
                active: !unit.active,
                name: unit.name,
              },
            },
          });
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (unit: Unit) => {
          setEditUnit(unit);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      { id: 'name', label: 'Unit', columnType: 'string' },
      { id: 'overtimeCode', label: 'Overtime Code', columnType: 'string', renderValue: (value) => value || '-' },
      { id: 'active', label: 'Active', width: 110, columnType: 'boolean' },
      { id: 'createdAt', label: 'Create at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
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

  const handleDeleteRow = useCallback(
    () => {
      removeUnit({
        variables: {
          id: editUnit?.id,
        },
      }).then(() => {
        setEditUnit(null);
        deleteConfirm.onFalse();
      });
    },
    [removeUnit, editUnit, setEditUnit, deleteConfirm]
  );

  const handleUpsert = useCallback(
    () => {
      setEditUnit(null);
    },
    [setEditUnit]
  );

  return (
    <>
      <GQLTable config={config} />

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
      <UpsertUnitDialogue
        upsertUnit={upsertUnit}
        unit={editUnit}
        onUpsertUnit={handleUpsert}
      />
    </>
  )
};


