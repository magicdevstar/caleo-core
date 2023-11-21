import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
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
import { GET_ALL_EVENTS, REMOVE_EVENT } from 'src/api/event';
import { GET_USERS_SLIM } from 'src/api/user';

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
        id: 'referenceId',
        label: 'Ref #',
        columnType: 'string',
        width: 100,
        getHref: (row) => `/dashboard/admin/overtime/events/${row.id}`,
      },
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        getHref: (row) => `/dashboard/admin/overtime/events/${row.id}`,
      },
      { id: 'startTime', label: 'Starts At', width: 160, columnType: 'date' },
      { id: 'venue.name', label: 'Venue', width: 210, columnType: 'string' },
      {
        id: 'availableShifts', label: 'Open Shifts', width: 110, columnType: 'string',
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
      },
      {
        id: 'endTime',
        type: 'hidden',
        defaultValue: {
          gte: new Date().toISOString(),
        },
      },
      {
        id: 'range',
        type: 'dateRange',
        dateRangeType: 'start',
      },
      {
        id: 'status',
        type: 'select',
        label: 'Status',
        async fetchOptions () {
          const formattedOptions = [
            {
              label: 'Draft',
              value: EventStatus.Draft,
            },
            {
              label: 'First Come First Serve',
              value: EventStatus.FirstComeFirstServe,
            },
            {
              label: 'Lottery',
              value: EventStatus.ReadyForLottery,
            },
            {
              label: 'Complete',
              value: EventStatus.Complete,
            },
            {
              label: 'Removed',
              value: EventStatus.Removed,
            },
          ];
          // eslint-disable-next-line react/no-this-in-sfc
          this.calculatedOptions = formattedOptions;
          return formattedOptions;
        },
      },
      {
        id: 'createdById',
        type: 'select',
        label: 'Created by',
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
