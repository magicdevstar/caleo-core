import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
// @mui
import LoadingButton from '@mui/lab/LoadingButton';
// @apollo/client
import { useMutation } from '@apollo/client';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import GQLTable from 'src/components/table/gql/table';
import { ConfirmDialog } from 'src/components/custom-dialog';
// types
import { Event } from 'src/__generated__/resolvers-types';
import { TableConfig } from 'src/components/table/table-config';
import { GET_ALL_EVENTS, REMOVE_EVENT } from 'src/api/event';

// ----------------------------------------------------------------------

export default function EventsTable() {
  const navigate = useNavigate();

  const [removeEvent, { loading: removeEventLoading }] = useMutation(REMOVE_EVENT, {
    refetchQueries: [GET_ALL_EVENTS],
  });

  const [editEvent, setEditEvent] = useState<Event | null>(null);
  const deleteConfirm = useBoolean();

  const config: TableConfig<Event> = {
    header: {
      title: 'Events',
      button: {
        text: 'Add Event',
        icon: 'ic:baseline-add',
        onClick: () => {
          navigate('/dashboard/admin/overtime/events/new');
        },
      }
    },
    search: {
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
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Event) => {
          navigate(`/dashboard/admin/overtime/events/${row.id}`);
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
        getHref: (row) => `/dashboard/admin/overtime/events/${row.id}`,
      },
      { id: 'startTime', label: 'Starts At', width: 160, columnType: 'date' },
      { id: 'venue.name', label: 'Venue', width: 210, columnType: 'string' },
      { id: '', width: 88, columnType: 'action', label: '' },
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
