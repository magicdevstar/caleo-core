import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { EventStatus, Event } from "src/__generated__/resolvers-types";
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
        const { events: { items } } = d || { events: { items: [], total: 0 } };

        // Get user's skill IDs
        const userSkillIds = user?.member?.memberSkills
          ?.filter(memberSkill => memberSkill?.status === 'APPROVED')
          ?.map(memberSkill => memberSkill?.skillId)
          ?.filter(Boolean) || [];
        
        // Filter events based on required skills
        const filteredEvents = items.filter((event: Event) => {
          const requiredSkillIds = event.requiredSkills?.map(skill => skill?.id).filter(Boolean) || [];
          
          // If no skills are required, event is open to all users
          if (requiredSkillIds.length === 0) {
            return true;
          }
          
          // Check if user has all required skills
          return requiredSkillIds.every(requiredSkillId => 
            userSkillIds.includes(requiredSkillId)
          );
        });

        return {
          total: filteredEvents.length,
          items: filteredEvents,
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
    <GQLTable sx={{ height: '100%' }} config={config} />
  )
}