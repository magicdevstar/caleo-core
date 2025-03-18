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
import { Division } from 'src/__generated__/resolvers-types';
import { GET_DIVISIONS, REMOVE_DIVISION, UPSERT_DIVISION } from 'src/api/division';
import { getBooleanFilters, TableConfig } from 'src/components/table/table-config';
//
import UpsertDivisionDialogue from './upsert-division-dialogue';

// ----------------------------------------------------------------------

export default function DivisionTable() {
  const { enqueueSnackbar } = useSnackbar();
  const [updateDivision] = useMutation(UPSERT_DIVISION, {
    refetchQueries: [GET_DIVISIONS],
  });

  const [removeDivision] = useMutation(REMOVE_DIVISION, {
    refetchQueries: [GET_DIVISIONS],
    onError: (error) => {
      enqueueSnackbar(error.message, { variant: 'error', autoHideDuration: 4000 });
    }
  });

  const [editDivision, setEditDivision] = useState<Division | null>(null);
  const deleteConfirm = useBoolean();
  const upsertDivision = useBoolean();

  const config: TableConfig<Division> = {
    header: {
      title: 'Divisions',
      button: {
        text: 'Add Division',
        icon: 'ic:baseline-add',
        onClick: () => {
          upsertDivision.onTrue();
        },
      }
    },
    search: {
      query: GET_DIVISIONS,
      processResult: (data: any) => {
        if (!data?.divisions) {
          return {
            items: [],
            total: 0,
          };
        }
        const { divisions: { items, total } } = data || { divisions: { items: [], total: 0 } };
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
        onClick: (row: Division) => {
          setEditDivision(row);
          upsertDivision.onTrue();
        },
      },
      {
        getName: (row: Division) => row.active ? 'Deactivate' : 'Activate',
        getIcon: (row: Division) => row.active ? 'solar:close-circle-bold' : 'solar:check-circle-bold',
        onClick: async (division: Division) => {
          updateDivision({
            variables: {
              input: {
                id: division.id,
                active: !division.active,
                name: division.name,
              },
            },
          });
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (division: Division) => {
          setEditDivision(division);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      { id: 'name', label: 'Division', columnType: 'string' },
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
      removeDivision({
        variables: {
          id: editDivision?.id,
        },
      }).then(() => {
        setEditDivision(null);
        deleteConfirm.onFalse();
      });
    },
    [removeDivision, editDivision, setEditDivision, deleteConfirm]
  );

  const handleUpsert = useCallback(
    () => {
      setEditDivision(null);
    },
    [setEditDivision]
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
      <UpsertDivisionDialogue
        upsertDivision={upsertDivision}
        division={editDivision}
        onUpsertDivision={handleUpsert}
      />
    </>
  )
};


