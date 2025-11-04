// components
import GQLTable from 'src/components/table/gql/table';
// types
import { Event, EventStatus } from 'src/__generated__/resolvers-types';
import { TableConfig } from 'src/components/table/table-config';
import { GET_ALL_EVENTS } from 'src/api/event';
import { paths } from 'src/routes/paths';

// ----------------------------------------------------------------------

export default function FinanceUnitTable({
  pathLink = paths.dashboard.admin.eventManagement.financeUnitDetail,
}: {
  pathLink?: string;
}) {
  const config: TableConfig<Event> = {
    header: {
      title: 'Events'
    },
    search: {
      defaultTableConfig: {
        defaultOrderBy: 'startTime',
        defaultOrder: 'desc',
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
    rowActions: [],
    columns: [
      {
        id: 'referenceId',
        label: 'Ref #',
        columnType: 'string',
        width: 100,
        getHref: (row: any) => pathLink.replace(':eventId', row.id),
      },
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        getHref: (row: any) => pathLink.replace(':eventId', row.id),
      },
      { id: 'startTime', label: 'Starts At', width: 160, columnType: 'date' },
      {
        id: 'venue.name',
        label: 'Venue',
        width: 210,
        columnType: 'string',
        noSort: true,
      },
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
        type: 'hidden',
        label: 'Status',
        defaultValue: [
          EventStatus.FirstComeFirstServe,
          EventStatus.InterestList,
          EventStatus.Complete,
          EventStatus.Incident,
        ],
      },
    ]
  };

  return (
    <GQLTable config={config} />
  );
};
