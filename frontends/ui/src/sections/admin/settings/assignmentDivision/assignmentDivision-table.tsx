import { useCallback } from 'react';
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
import { AssignmentDivision } from 'src/__generated__/resolvers-types';
import { GET_ASSIGNMENT_DIVISIONS, REMOVE_ASSIGNMENT_DIVISION, UPSERT_ASSIGNMENT_DIVISION } from 'src/api/assignmentDivision';
import { getBooleanFilters, TableConfig } from 'src/components/table/table-config';
//
import UpsertDialogue from './upsert-assignmentDivision-dialogue';

// ----------------------------------------------------------------------

export default function Table() {
  const { enqueueSnackbar } = useSnackbar();
  const [update] = useMutation(UPSERT_ASSIGNMENT_DIVISION, {
    refetchQueries: [GET_ASSIGNMENT_DIVISIONS],
  });

  const [remove] = useMutation(REMOVE_ASSIGNMENT_DIVISION, {
    refetchQueries: [GET_ASSIGNMENT_DIVISIONS],
    onError: (error) => {
      enqueueSnackbar(error.message, { variant: 'error', autoHideDuration: 4000 });
    }
  });

  const deleteConfirm = useBoolean<AssignmentDivision>();
  const upsert = useBoolean<AssignmentDivision>();

  const config: TableConfig<AssignmentDivision> = {
    header: {
      title: 'Assignment Divisions',
      button: {
        text: 'Add Assignment Division',
        icon: 'ic:baseline-add',
        onClick: () => {
          upsert.onTrue();
        },
      }
    },
    search: {
      query: GET_ASSIGNMENT_DIVISIONS,
      processResult: (data: any) => {
        if (!data?.assignmentDivisions) {
          return {
            items: [],
            total: 0,
          };
        }
        const { assignmentDivisions: { items, total } } = data || { assignmentDivisions: { items: [], total: 0 } };
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
        onClick: (row: AssignmentDivision) => {
          upsert.onTrue(row);
        },
      },
      {
        getName: (row: AssignmentDivision) => row.active ? 'Deactivate' : 'Activate',
        getIcon: (row: AssignmentDivision) => row.active ? 'solar:close-circle-bold' : 'solar:check-circle-bold',
        onClick: async (row: AssignmentDivision) => {
          update({
            variables: {
              input: {
                id: row.id,
                active: !row.active,
                name: row.name,
              },
            },
          });
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (row: AssignmentDivision) => {
          deleteConfirm.onTrue(row);
        },
      }
    ],
    columns: [
      { id: 'name', label: 'Name', columnType: 'string' },
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
      remove({
        variables: {
          id: deleteConfirm.attribute?.id,
        },
      }).then(() => {
        deleteConfirm.onFalse();
      });
    },
    [remove, deleteConfirm]
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
      <UpsertDialogue upsert={upsert} />
    </>
  )
};


