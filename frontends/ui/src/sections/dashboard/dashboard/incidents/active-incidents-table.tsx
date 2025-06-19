import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { EventStatus } from "src/__generated__/resolvers-types";
import { GET_ALL_EVENTS } from "src/api/event";
import { useAuthContext } from "src/auth/hooks";
import GQLTable from "src/components/table/gql/table"
import { TableConfig } from "src/components/table/table-config";
import { getNow } from "src/hooks/use-datejs";
import { useIncidentLinks } from "src/hooks/use-incident-link";

export const ActiveIncidentsTable = () => {
  const { getHref } = useIncidentLinks();
  const { user } = useAuthContext();
  const currentTime = useMemo(() => getNow({ organization: user?.member?.org! }).toISOString(), [user]);

  const { data, loading } = useQuery(
    GET_ALL_EVENTS,
    {
      fetchPolicy: 'network-only', // Used for first execution
      nextFetchPolicy: 'cache-first', // Used for subsequent executions
      notifyOnNetworkStatusChange: true,
      variables: {
        input: {
          status: [EventStatus.Incident],
          range: {
            startTime: {
              lte: currentTime,
            },
            endTime: {
              gte: currentTime,
            },
          },
        },
      },
    }
  );

  const config: TableConfig<Event> = {
    header: {
      title: '⚠️ Active Incidents',
    },
    table: {
      denseHeight: 30,
      sx: {
        minWidth: 'inherit',
      },
      noData: {
        title: 'No active incidents',
        hideHeader: true,
        sx: {
          pt: 1,
          pb: 6,
          pl: 0,
          pr: 0,
        },
      }
    },
    search: {
      data,
      query: GET_ALL_EVENTS,
      loading,
      defaultTableConfig: {
        defaultRowsPerPage: loading ? 4 : 5,
      },
      processResult: (d: any, options) => {
        const { events: { items, total } } = d || { events: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      },
    },
    rowActions: [],
    columns: [
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
        getHref: (row: any) => getHref(row.id),
      },
      {
        id: 'ocn',
        label: 'OCN',
        columnType: 'string',
        getHref: (row: any) => getHref(row.id),
      },
      {
        id: 'endTime',
        label: 'End Time',
        columnType: 'date',
        getHref: (row: any) => getHref(row.id),
      },
    ],
    filters: []
  };

  return (
    <GQLTable config={config} />
  )
}