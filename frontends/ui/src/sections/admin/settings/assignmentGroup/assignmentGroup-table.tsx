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
import { AssignmentGroup } from 'src/__generated__/resolvers-types';
import { GET_ASSIGNMENT_GROUPS, REMOVE_ASSIGNMENT_GROUP, UPSERT_ASSIGNMENT_GROUP } from 'src/api/assignmentGroup';
import { getBooleanFilters, TableConfig } from 'src/components/table/table-config';
//
import UpsertDialogue from './upsert-assignmentGroup-dialogue';

// ----------------------------------------------------------------------

export default function Table() {
  const { enqueueSnackbar } = useSnackbar();
  const [update] = useMutation(UPSERT_ASSIGNMENT_GROUP, {
    refetchQueries: [GET_ASSIGNMENT_GROUPS],
  });

  const [remove] = useMutation(REMOVE_ASSIGNMENT_GROUP, {
    refetchQueries: [GET_ASSIGNMENT_GROUPS],
    onError: (error) => {
      enqueueSnackbar(error.message, { variant: 'error', autoHideDuration: 4000 });
    }
  });

  const deleteConfirm = useBoolean<AssignmentGroup>();
  const upsert = useBoolean<AssignmentGroup>();

  const config: TableConfig<AssignmentGroup> = {
    header: {
      title: 'Assignment Groups',
      button: {
        text: 'Add Assignment Group',
        icon: 'ic:baseline-add',
        onClick: () => {
          upsert.onTrue();
        },
      }
    },
    search: {
      query: GET_ASSIGNMENT_GROUPS,
      processResult: (data: any) => {
        if (!data?.assignmentGroups) {
          return {
            items: [],
            total: 0,
          };
        }
        const { assignmentGroups: { items, total } } = data || { assignmentGroups: { items: [], total: 0 } };
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
        onClick: (row: AssignmentGroup) => {
          upsert.onTrue(row);
        },
      },
      {
        getName: (row: AssignmentGroup) => row.active ? 'Deactivate' : 'Activate',
        getIcon: (row: AssignmentGroup) => row.active ? 'solar:close-circle-bold' : 'solar:check-circle-bold',
        onClick: async (row: AssignmentGroup) => {
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
        onClick: (row: AssignmentGroup) => {
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


