import { useCallback } from 'react';
import { useSnackbar } from 'notistack';
// @mui
import Button from '@mui/material/Button';
// @apollo/client
import { useMutation, useQuery } from '@apollo/client';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
// types
import { OutsideUser } from 'src/__generated__/resolvers-types';
import { GET_OUTSIDE_USERS, REMOVE_OUTSIDE_USER } from 'src/api/outsideUser';
import { TableConfig } from 'src/components/table/table-config';
import UpsertOutsideUserDialogue from './upsert-outside-user-dialogue';
//
// import UpsertRankDialogue from './upsert-outside-user-dialogue';

// ----------------------------------------------------------------------

export default function OutsideUserTable() {
  const { enqueueSnackbar } = useSnackbar();
  const [remove] = useMutation(REMOVE_OUTSIDE_USER, {
    refetchQueries: [GET_OUTSIDE_USERS],
    onError: (error) => {
      enqueueSnackbar(error.message, { variant: 'error', autoHideDuration: 4000 });
    }
  });

  const upsertDialogue = useBoolean<OutsideUser | null>({ defaultValue: false, trackedAttribute: null });
  const deleteConfirm = useBoolean<OutsideUser | null>({ defaultValue: false, trackedAttribute: null });

  const config: TableConfig<OutsideUser> = {
    header: {
      title: 'External Users',
      button: {
        text: 'Add External Users',
        icon: 'ic:baseline-add',
        onClick: () => {
          upsertDialogue.onTrue();
        },
      }
    },
    search: {
      query: GET_OUTSIDE_USERS,
      processResult: (data: any) => {
        const { outsideUsers: { items, total } } = data || { outsideUsers: { items: [], total: 0 } };
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
    rowActions: [],
    columns: [
      { id: 'name', label: 'Name', columnType: 'string' },
      { id: 'email', label: 'Email', columnType: 'string' },
      {
        id: '',
        width: 88,
        columnType: 'action',
        label: '',
        noSort: true,
        renderValue: (_val, _index, row) => (
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              console.log(row);
              deleteConfirm.onTrue(row);
            }}
          >
            Delete
          </Button>
        ),
      },
    ],
    filters: [
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
    async () => {
      try {
        console.log('Deleting outside user:', deleteConfirm);
        await remove({
          variables: {
            id: deleteConfirm.attribute?.id,
          },
        });
      } catch (error) {
        console.error('Error deleting outside user:', error);
      } finally {
        deleteConfirm.onFalse();
      }
    },
    [remove, deleteConfirm]
  );

  return (
    <>
      <GQLTable config={config} />

      <UpsertOutsideUserDialogue user={upsertDialogue.attribute} controller={upsertDialogue} />

      <ConfirmDialog
        open={deleteConfirm.value}
        onClose={deleteConfirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button autoFocus variant="contained" color="error" onClick={handleDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  )
};


