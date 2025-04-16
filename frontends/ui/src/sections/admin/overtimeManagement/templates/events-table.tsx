import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSnackbar } from 'notistack';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
// @apollo/client
import { useMutation } from '@apollo/client';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
import { client } from 'src/utils/apollo';
// components
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
// types
import { Event, EventStatus, User } from 'src/__generated__/resolvers-types';
import { TableConfig } from 'src/components/table/table-config';
import { CLONE_EVENT_BY_ID, GET_ALL_EVENTS, REMOVE_EVENT } from 'src/api/event';
import { GET_USERS_SLIM } from 'src/api/user';
import { GET_VENUES_SLIM } from 'src/api/venues';

// ----------------------------------------------------------------------

export default function EventTemplateTable() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [removeEvent, { loading: removeEventLoading }] = useMutation(REMOVE_EVENT, {
    refetchQueries: [GET_ALL_EVENTS],
  });

  const [cloneEvent] = useMutation(CLONE_EVENT_BY_ID, {
    refetchQueries: [GET_ALL_EVENTS],
  });

  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const deleteConfirm = useBoolean();

  const config: TableConfig<Event> = {
    header: {
      title: 'Event Templates',
      buttons: [
        {
          key: 'add-event',
          text: 'Add Event',
          icon: 'ic:baseline-add',
          onClick: () => {
            navigate('/dashboard/admin/overtime/templates/events/new');
          },
        },
      ]
    },
    search: {
      defaultTableConfig: {
        defaultRowsPerPage: 10,
      },
      query: GET_ALL_EVENTS,
      processResult: (data: any) => {
        const { events: { items, total } } = data || { events: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      }
    },
    rowActions: [
      {
        getName: () => 'Create Event',
        getIcon: () => 'solar:magic-stick-3-bold',
        onClick: async (row: Event) => {
          try {
            enqueueSnackbar('Creating event...', { variant: 'info', autoHideDuration: 2000 });
            const clonedEvent = await cloneEvent({
              variables: {
                id: row.id,
              },
            });
            navigate(`/dashboard/admin/overtime/events/${clonedEvent.data.cloneEvent.id}`);
          } catch(error) {
            enqueueSnackbar('Error creating event. Please try again.', { variant: 'error' });
          }
        },
      },
      {
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Event) => {
          navigate(`/dashboard/admin/overtime/templates/events/${row.id}`);
        },
      },
      {
        getName: () => 'Delete',
        getIcon: () => 'solar:trash-bin-trash-bold',
        onClick: (row: Event) => {
          setEditEvent(row);
          deleteConfirm.onTrue();
        },
      }
    ],
    columns: [
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        getHref: (row: any) => `/dashboard/admin/overtime/templates/events/${row.id}`,
      },
      {
        id: 'venue.name',
        label: 'Venue',
        width: 210,
        columnType: 'string',
        noSort: true,
      },
      {
        id: 'totalShifts',
        label: 'Total Shifts',
        width: 120,
        columnType: 'string',
        noSort: true,
      },
      { id: '', width: 88, columnType: 'action', label: '' },
    ],
    filters: [
      {
        id: 'query',
        type: 'text',
        label: 'Search',
        defaultValue: '',
        value: '',
        sizing: {
          md: 6,
          lg: 6,
        },
      },
      {
        id: 'createdById',
        type: 'select',
        label: 'Created by',
        sizing: {
          md: 3,
          lg: 3,
        },
        async fetchOptions () {
          const { data } = await client.query({
            query: GET_USERS_SLIM,
            variables: {
              input: {
                admin: true,
                limit: 100000,
              }
            },
          });
          const admins = data?.users?.items || [];
          const formattedAdmins = admins.map(({ id, name }: User) => ({ value: id, label: name }));
          // eslint-disable-next-line react/no-this-in-sfc
          this.calculatedOptions = formattedAdmins;
          return formattedAdmins;
        },
      },
      {
        id: 'venueIds',
        type: 'autocomplete',
        label: 'Venue Name',
        autoComplete: {
          multiSelect: true,
          inputLabel: 'Venue Name',
          inputPlaceholder: 'Search...',
        },
        sizing: {
          md: 3,
          lg: 3,
        },
        async fetchOptions (query?: string) {
          const { data } = await client.query({
            query: GET_VENUES_SLIM,
            variables: {
              input: {
                query,
                limit: 10,
                skip: 0,
              },
            },
          });
          const formattedOptions = data?.venues?.items?.map(({ id, name }: any) => ({ value: id, label: name })) || [];
          return formattedOptions;
        },
      },
      {
        id: 'status',
        type: 'hidden',
        label: 'Status',
        defaultValue: [EventStatus.Template],
      },
    ]
  };

  const handleDeleteRow = useCallback(
    () => {
      removeEvent({
        variables: {
          id: editEvent?.id,
        },
      }).then(() => {
        setEditEvent(null);
        deleteConfirm.onFalse();
      });
    },
    [removeEvent, editEvent, setEditEvent, deleteConfirm]
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
          <LoadingButton loading={removeEventLoading} variant="contained" color="error" onClick={handleDeleteRow}>
            Delete
          </LoadingButton>
        }
      />
    </>
  )
};
