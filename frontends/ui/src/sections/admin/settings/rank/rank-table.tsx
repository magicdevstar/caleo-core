import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
// @mui
import Button from '@mui/material/Button';
// @apollo/client
import { useMutation } from '@apollo/client';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
import { useFeatures } from 'src/hooks/use-features';
// components
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
// types
import { Rank } from 'src/__generated__/resolvers-types';
import { GET_RANKS, REMOVE_RANK, UPSERT_RANK } from 'src/api/rank';
import { getBooleanFilters, TableConfig } from 'src/components/table/table-config';
//
import UpsertRankDialogue from './upsert-rank-dialogue';

// ----------------------------------------------------------------------

export default function RankTable() {
  const { rankHourlyRate, rankGrouping } = useFeatures();
  const { enqueueSnackbar } = useSnackbar();
  const [updateRank] = useMutation(UPSERT_RANK, {
    refetchQueries: [GET_RANKS],
  });

  const [removeRank] = useMutation(REMOVE_RANK, {
    refetchQueries: [GET_RANKS],
    onError: (error) => {
      enqueueSnackbar(error.message, { variant: 'error', autoHideDuration: 4000 });
    }
  });

  const [editRank, setEditRank] = useState<Rank | null>(null);
  const deleteConfirm = useBoolean();
  const upsertRank = useBoolean();

  const config: TableConfig<Rank> = {
    header: {
      title: 'Ranks',
      button: {
        text: 'Add Rank',
        icon: 'ic:baseline-add',
        onClick: () => {
          upsertRank.onTrue();
        },
      }
    },
    search: {
      query: GET_RANKS,
      processResult: (data: any) => {
        const { ranks: { items, total } } = data || { ranks: { items: [], total: 0 } };
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
        onClick: (row: Rank) => {
          setEditRank(row);
          upsertRank.onTrue();
        },
      },
      {
        getName: (row: Rank) => row.active ? 'Deactivate' : 'Activate',
        getIcon: (row: Rank) => row.active ? 'solar:close-circle-bold' : 'solar:check-circle-bold',
        onClick: async (rank: Rank) => {
          updateRank({
            variables: {
              input: {
                id: rank.id,
                active: !rank.active,
                name: rank.name,
              },
            },
          });
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (rank: Rank) => {
          setEditRank(rank);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      { id: 'name', label: 'Rank', columnType: 'string' },
      ...(rankHourlyRate ? [{
        id: 'hourlyRate',
        label: 'Hourly/Incident Rate',
        width: 180,
        columnType: 'string',
        renderValue: (value: string, _index: number, row: Rank) => {
          const rate = `$ ${value || '-'}`;
          const incidentRate = row.incidentHourlyRate ? ` / ${row.incidentHourlyRate}` : ' / -';
          return `${rate}${incidentRate}`;
        }
      }] : [] as any[]),
      ...(rankGrouping ? [{ id: 'rankGroup.name', label: 'Group Name', width: 210, columnType: 'string', renderValue: (value: string) => value || '-' }] : [] as any[]),
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
      removeRank({
        variables: {
          id: editRank?.id,
        },
      }).then(() => {
        setEditRank(null);
        deleteConfirm.onFalse();
      });
    },
    [removeRank, editRank, setEditRank, deleteConfirm]
  );

  const handleUpsert = useCallback(
    () => {
      setEditRank(null);
    },
    [setEditRank]
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
      <UpsertRankDialogue
        upsertRank={upsertRank}
        rank={editRank}
        onUpsertRank={handleUpsert}
      />
    </>
  )
};


