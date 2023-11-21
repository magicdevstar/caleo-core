import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
// @mui
import Button from '@mui/material/Button';
// @apollo/client
import { useMutation } from '@apollo/client';
// hooks
import { enqueueSnackbar } from 'notistack';
import { useBoolean } from 'src/hooks/use-boolean';
// components
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
// types
import { Venue, VenueStatus } from 'src/__generated__/resolvers-types';
import { TableConfig } from 'src/components/table/table-config';
import { GET_ALL_VENUES, GET_VENUES_FOR_CSV, REMOVE_VENUE, UPSERT_VENUE } from 'src/api/venues';
import { client } from 'src/utils/apollo';
import { useDownloadCsv } from 'src/hooks/use-download-csv';


// ----------------------------------------------------------------------

export default function VenuesTable() {
  const navigate = useNavigate();

  const { download } = useDownloadCsv({ fileName: 'venues', ext: 'csv' });
  const [loadingCSV, setLoadingCSV] = useState(false);

  const [updateVenue] = useMutation(UPSERT_VENUE, {
    refetchQueries: [GET_ALL_VENUES],
  });

  const [removeVenue] = useMutation(REMOVE_VENUE, {
    refetchQueries: [GET_ALL_VENUES],
  });

  const [editVenue, setEditVenue] = useState<Venue | null>(null);
  const deleteConfirm = useBoolean();

  const config: TableConfig<Venue> = {
    header: {
      title: 'Venues',
      buttons: [
        {
          key: 'download',
          text: 'Export CSV',
          variant: 'outlined',
          icon: 'mdi:file-download',
          loading: loadingCSV,
          onClick: async () => {
            setLoadingCSV(true);
            try {
              const res = await client.query({
                query: GET_VENUES_FOR_CSV,
                variables: {
                  input: {
                    limit: 10000,
                    skip: 0,
                    orderBy: "createdAt",
                    order: "desc",
                  },
                }
              });
              const { venues: { items } } = res.data;
              download(items.map(({__typename, contact, ...item}: Venue) => ({
                ...item,
                contactFirstName: contact?.firstName,
                contactLastName: contact?.lastName,
                contactPhone: contact?.phone,
                contactEmail: contact?.email,
              })));
            } catch(error) {
              enqueueSnackbar('Could not download CSV. Try again later', { variant: 'error', autoHideDuration: 3000 });
            } finally {
              setLoadingCSV(false);
            }
          },
        },
        {
          key: 'venue',
          text: 'Add Venue',
          icon: 'ic:baseline-add',
          onClick: () => {
            navigate('/dashboard/admin/overtime/venues/new');
          },
        },
      ]
    },
    search: {
      defaultTableConfig: {
        defaultRowsPerPage: 10,
      },
      query: GET_ALL_VENUES,
      processResult: (data: any) => {
        const { venues: { items, total } } = data || { venues: { items: [], total: 0 } };
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
        onClick: (row: Venue) => {
          navigate(`/dashboard/admin/overtime/venues/${row.id}`);
        },
      },
      {
        getName: (row: Venue) => row.status === VenueStatus.Active ? 'Deactivate' : 'Activate',
        getIcon: (row: Venue) => row.status === VenueStatus.Active ? 'solar:close-circle-bold' : 'solar:check-circle-bold',
        onClick: async (row: Venue) => {
          updateVenue({
            variables: {
              input: {
                id: row.id,
                name: row.name,
                status: row.status === VenueStatus.Active ? VenueStatus.Inactive : VenueStatus.Active,
              },
            },
          });
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (row: Venue) => {
          setEditVenue(row);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        getHref: (row) => `/dashboard/admin/overtime/venues/${row.id}`,
      },
      { id: 'address', label: 'Address', width: 210, columnType: 'string' },
      {
        id: 'contact.firstName',
        label: 'Contact Name',
        width: 150,
        columnType: 'string',
        renderValue: (_value, _index, row: Venue) =>
          `${row.contact?.firstName} ${row.contact?.lastName}`
      },
      {
        id: 'status',
        label: 'Status',
        width: 110,
        columnType: 'string',
        renderValue: (status) => {
          switch (status) {
            case VenueStatus.Active:
              return 'Active';
            case VenueStatus.Inactive:
            default:
              return 'Inactive';
          }
        }
      },
      { id: 'createdAt', label: 'Created at', width: 160, columnType: 'date' },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
      {
        id: 'status',
        type: 'select',
        label: 'Active',
        defaultValue: [],
        value: [],
        fetchOptions: () => Promise.resolve([
          { value: VenueStatus.Active, label: 'Active' },
          { value: VenueStatus.Inactive, label: 'InActive' },
        ]),
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
      removeVenue({
        variables: {
          id: editVenue?.id,
        },
      }).then(() => {
        setEditVenue(null);
        deleteConfirm.onFalse();
      });
    },
    [removeVenue, editVenue, setEditVenue, deleteConfirm]
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
    </>
  )
};


