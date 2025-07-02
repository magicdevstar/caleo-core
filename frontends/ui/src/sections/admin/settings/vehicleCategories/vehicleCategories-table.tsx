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
import { VehicleCategories } from 'src/__generated__/resolvers-types';
import { GET_VEHICLE_CATEGORIES, REMOVE_VEHICLE_CATEGORY, UPSERT_VEHICLE_CATEGORY } from 'src/api/vehicleCategories';
import { getBooleanFilters, TableConfig } from 'src/components/table/table-config';
//
import UpsertVehicleCategoryDialogue from './upsert-vehicleCategories-dialogue';

// ----------------------------------------------------------------------

export default function VehicleCategoriesTable() {
  const { enqueueSnackbar } = useSnackbar();
  const [update] = useMutation(UPSERT_VEHICLE_CATEGORY, {
    refetchQueries: [GET_VEHICLE_CATEGORIES],
  });

  const [remove] = useMutation(REMOVE_VEHICLE_CATEGORY, {
    refetchQueries: [GET_VEHICLE_CATEGORIES],
    onError: (error) => {
      enqueueSnackbar(error.message, { variant: 'error', autoHideDuration: 4000 });
    }
  });

  const [edit, setEdit] = useState<VehicleCategories | null>(null);
  const deleteConfirm = useBoolean();
  const upsert = useBoolean();

  const config: TableConfig<VehicleCategories> = {
    header: {
      title: 'Vehicle Categories',
      button: {
        text: 'Add Vehicle Category',
        icon: 'ic:baseline-add',
        onClick: () => {
          upsert.onTrue();
        },
      }
    },
    search: {
      query: GET_VEHICLE_CATEGORIES,
      processResult: (data: any) => {
        if (!data?.vehicleCategories) {
          return {
            items: [],
            total: 0,
          };
        }
        const { vehicleCategories: { items, total } } = data || { vehicleCategories: { items: [], total: 0 } };
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
        onClick: (row: VehicleCategories) => {
          setEdit(row);
          upsert.onTrue();
        },
      },
      {
        getName: (row: VehicleCategories) => row.active ? 'Deactivate' : 'Activate',
        getIcon: (row: VehicleCategories) => row.active ? 'solar:close-circle-bold' : 'solar:check-circle-bold',
        onClick: async (row: VehicleCategories) => {
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
        onClick: (row: VehicleCategories) => {
          setEdit(row);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      { id: 'name', label: 'Name', columnType: 'string' },
      { id: 'milageRate', label: 'Milage Rate', width: 110, columnType: 'string', renderValue: (value: string) => `$ ${value || '-'}` },
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
          id: edit?.id,
        },
      }).then(() => {
        setEdit(null);
        deleteConfirm.onFalse();
      });
    },
    [remove, edit, setEdit, deleteConfirm]
  );

  const handleUpsert = useCallback(
    () => {
      setEdit(null);
    },
    [setEdit]
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
      <UpsertVehicleCategoryDialogue
        upsert={upsert}
        data={edit}
        onUpsert={handleUpsert}
      />
    </>
  )
};


