import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSnackbar } from 'notistack';
import copy from 'copy-to-clipboard';
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
import { CLONE_EVENT_BY_ID, GET_ALL_EVENTS, NOTIFY_OF_EVENT, REMOVE_EVENT } from 'src/api/event';
import { GET_USERS_SLIM } from 'src/api/user';
import { useEventSummary } from 'src/hooks/use-event-summary';
import { GET_VENUES_SLIM } from 'src/api/venues';
import { convertDate, dateFormat } from 'src/hooks/use-datejs';
import { useAuthContext } from 'src/auth/hooks';
import { useFeatures } from 'src/hooks/use-features';
import { useRouter } from 'src/routes/hooks';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function EventsTable() {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthContext();
  const router = useRouter();
  const {
    interestLists,
    venueContractDates,
    externalEventRequests,
    kiosk,
    eventTemplates,
  } = useFeatures();
  const navigate = useNavigate();
  const { generateEventDownload } = useEventSummary();
  const [notifyOfEvent] = useMutation(NOTIFY_OF_EVENT);
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
      title: 'Events',
      buttons: [
        ...(externalEventRequests ? [
          {
            key: 'copy-event-request-url',
            text: 'Copy Event Request URL',
            icon: 'ic:baseline-content-copy',
            onClick: () => {
              copy(`${window.location.origin}/external/request/event?orgId=${user?.member?.org?.id}`);
            },
          },
        ] : []),
        {
          key: 'add-event',
          text: 'Add Event',
          icon: 'ic:baseline-add',
          onClick: () => {
            navigate('/dashboard/admin/overtime/events/new');
          },
        }
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
        getName: () => 'Edit',
        getIcon: () => 'solar:pen-bold',
        onClick: (row: Event) => {
          navigate(`/dashboard/admin/overtime/events/${row.id}`);
        },
      },
      ...(eventTemplates ? [
        {
          getName: () => 'Clone Event',
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
      ] : []),
      ...(kiosk ? [
        {
          getName: () => 'Check in kiosk',
          getIcon: () => 'material-symbols:moved-location',
          getDisabled: (row: Event) => [
            EventStatus.Complete,
            EventStatus.Draft,
            EventStatus.Removed,
            EventStatus.Requested,
            EventStatus.PreFirstComeFirstServe,
            EventStatus.PreLottery,
          ].includes(row.status),
          onClick: (row: Event) => {
            router.push(
              paths.kiosk.root.replace(':eventId', row.id)
            );
          },
        },
        {
          getName: () => 'Dashboard',
          getIcon: () => 'ic:baseline-dashboard',
          getDisabled: (row: Event) => [
            EventStatus.Complete,
            EventStatus.Draft,
            EventStatus.Removed,
            EventStatus.Requested,
            EventStatus.PreFirstComeFirstServe,
            EventStatus.PreLottery,
          ].includes(row.status),
          onClick: (row: Event) => {
            router.push(
              paths.kiosk.dashboard.replace(':eventId', row.id)
            );
          },
        },
      ] : []),
      {
        getName: () => 'Summary',
        getIcon: () => 'solar:file-download-bold',
        onClick: (row: Event) => {
          generateEventDownload(row.id);
        },
      },
      {
        getName: () => 'Notify',
        getHidden: (row: Event) => {
          let isScheduledInFuture = false;
          if (row.scheduledFirstComeFirstServe) {
            isScheduledInFuture = convertDate({ date: row.scheduledFirstComeFirstServe, user }).isAfter(new Date());
          }
          return row.status !== EventStatus.FirstComeFirstServe || row.availableShifts === 0 || isScheduledInFuture;
        },
        getIcon: () => 'solar:bell-bing-bold',
        onClick: async (row: Event) => {
          try {
            await notifyOfEvent({
              variables: {
                eventId: row.id,
              }
            });
            enqueueSnackbar('Successfully sent notification.', { variant: 'success', autoHideDuration: 3000 });
          } catch(error) {
            enqueueSnackbar('Failed to send notification. Please try again later.', { variant: 'error', autoHideDuration: 3000 });
          }
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
        getHref: (row: any) => `/dashboard/admin/overtime/events/${row.id}`,
      },
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        getHref: (row: any) => `/dashboard/admin/overtime/events/${row.id}`,
      },
      { id: 'startTime', label: 'Starts At', width: 160, columnType: 'date' },
      {
        id: 'venue.name',
        label: 'Venue',
        width: 210,
        columnType: 'string',
        noSort: true,
      },
      (venueContractDates && {
        id: 'venue.contract.expirationDate',
        label: 'Venue Contract Exp',
        width: 210,
        renderValue: (expirationDate: any) => expirationDate ? convertDate({ date: expirationDate, user }).format(dateFormat) : 'N/A',
        columnType: 'string',
        noSort: true,
      }) as any,
      {
        id: 'status',
        label: 'Type',
        width: 180,
        columnType: 'string',
        renderValue: (eventStatus: any) => {
          switch (eventStatus) {
            case EventStatus.Draft:
              return 'Draft';
            case EventStatus.ReadyForLottery:
              return 'Lottery';
            case EventStatus.FirstComeFirstServe:
              return 'First Come First Serve';
            case EventStatus.InterestList:
              return 'Interest List';
            case EventStatus.Complete:
              return 'Complete';
            case EventStatus.Removed:
              return 'Removed';
            case EventStatus.Requested:
              return 'Requested';
            default:
              return 'N/A';
          }
        },
        getLabelColor: (event: any) => {
          switch (event.status) {
            case EventStatus.ReadyForLottery:
              return 'success';
            case EventStatus.FirstComeFirstServe:
            case EventStatus.InterestList:
            case EventStatus.Requested:
              return 'primary';
            case EventStatus.Removed:
              return 'error';
            case EventStatus.Draft:
              return 'warning';
            default:
              return 'default';
          }
        }

      },
      {
        id: 'totalShifts',
        label: 'Total Shifts',
        width: 120,
        columnType: 'string',
        noSort: true,
      },
      {
        id: 'availableShifts',
        label: 'Open Shifts',
        width: 120,
        columnType: 'string',
        noSort: true,
      },
      { id: '', width: 88, columnType: 'action', label: '' },
    ].filter(Boolean),
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
        sizing: {
          md: 6,
          lg: 6,
        },
      },
      {
        id: 'status',
        type: 'select',
        label: 'Status',
        sizing: {
          md: 4,
          lg: 4,
        },
        async fetchOptions () {
          const formattedOptions = [
            {
              label: 'Draft',
              value: EventStatus.Draft,
            },
            {
              label: 'Pre First Come First Serve',
              value: EventStatus.PreFirstComeFirstServe,
            },
            {
              label: 'Requested',
              value: EventStatus.Requested,
            },
            ...(interestLists ? [
              {
                label: 'Interest List',
                value: EventStatus.InterestList,
              },
            ] : []),
            {
              label: 'First Come First Serve',
              value: EventStatus.FirstComeFirstServe,
            },
            {
              label: 'Pre Lottery',
              value: EventStatus.PreLottery,
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
        sizing: {
          md: 4,
          lg: 4,
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
          md: 4,
          lg: 4,
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
