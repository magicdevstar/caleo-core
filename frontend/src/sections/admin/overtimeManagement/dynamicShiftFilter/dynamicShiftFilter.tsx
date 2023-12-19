import { capitalize } from 'lodash';
import PhoneNumberFormatter from 'phone-number-formats';
import { DayOfWeek, Shift, ShiftStatus } from "src/__generated__/resolvers-types";
import { GET_ALL_EVENTS_SLIM } from "src/api/event";
import { GET_RANKS } from "src/api/rank";
import { DYNAMIC_SHIFT_SEARCH } from "src/api/shifts";
import { GET_SKILL_SLIM } from "src/api/skill";
import { GET_USERS_SLIM } from "src/api/user";
import GQLTable from "src/components/table/gql/table";
import { TableConfig } from "src/components/table/table-config";
import { client } from "src/utils/apollo";
import { paths } from 'src/routes/paths';


export default function DynamicShiftFilter() {
  const shiftHasBeenRemoved = (shift: Shift) =>
    shift.event?.removedAt ||
    shift.assignment?.removedAt ||
    [ShiftStatus.Removed, ShiftStatus.Relinquished, ShiftStatus.Unassigned].includes(shift.status);

  const config: TableConfig<Shift> = {
    header: {
      title: 'Dynamic Shift Filter',
    },
    table: {
      sx: {
        minWidth: 'inherit',
      }
    },
    search: {
      defaultTableConfig: {
        defaultRowsPerPage: 25,
      },
      query: DYNAMIC_SHIFT_SEARCH,
      processResult: (data: any) => {
        const { shifts: { items, total } } = data || { shifts: { items: [], total: 0 } };
        return {
          total,
          items,
        };
      },
    },
    rowActions: [],
    columns: [
      {
        id: 'refNumber',
        label: 'Shift Ref #',
        columnType: 'string',
        width: 150,
        getHref: (row) =>
          shiftHasBeenRemoved(row)
            ? ''
            : paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
                .replace(':eventId', row.event?.id || '')
                .replace(':assignmentId', row.assignment?.id || '')
                .replace(':shiftId', row.shiftId || ''),
      },
      {
        id: 'startTime',
        label: 'Start',
        columnType: 'date',
        width: 10,
        getHref: (row) =>
          shiftHasBeenRemoved(row)
            ? ''
            : paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
                .replace(':eventId', row.event?.id || '')
                .replace(':assignmentId', row.assignment?.id || '')
                .replace(':shiftId', row.shiftId || ''),
      },
      {
        id: 'endTime',
        label: 'End',
        columnType: 'date',
        width: 10,
        getHref: (row) =>
          shiftHasBeenRemoved(row)
            ? ''
            : paths.dashboard.admin.overtime.eventAssignmentShiftsDetail
                .replace(':eventId', row.event?.id || '')
                .replace(':assignmentId', row.assignment?.id || '')
                .replace(':shiftId', row.shiftId || ''),
      },
      {
        id: 'event.name',
        label: 'Event Name',
        columnType: 'string',
        width: 300,
        noSort: true,
      },
      {
        id: 'assignment.name',
        label: 'Shift Name',
        columnType: 'string',
        width: 300,
        noSort: true,
      },
      {
        id: 'assignment.ranks',
        label: 'Ranks',
        emptyArrayLabel: 'None',
        width: 100,
        noSort: true,
        columnType: 'array',
        maxRender: 1
      },
      {
        id: 'assignment.requiredSkills',
        label: 'Skills',
        width: 100,
        noSort: true,
        columnType: 'array',
        maxRender: 1
      },
      {
        id: 'status',
        label: 'Status',
        columnType: 'string',
        renderValue: (shiftStatus) => capitalize(shiftStatus),
        getLabelColor: (row) => {
          switch(row.status) {
            case ShiftStatus.Assigned:
              return 'success';
            case ShiftStatus.Available:
              return 'primary';
            case ShiftStatus.Relinquished:
              return 'error';
            case ShiftStatus.Unassigned:
              return 'warning';
            case ShiftStatus.Locked:
              return 'secondary';
            case ShiftStatus.Removed:
            default:
              return 'default';
          }
        },
      },
      {
        id: 'user.name',
        label: 'Assigned To',
        columnType: 'string',
        width: 100,
        noSort: true,
        renderValue(_value, _index, row) {
          if (row.user) {
            let phoneNumber = row.user?.member?.contactInfo?.primaryPhone?.number;
            try {
              phoneNumber = new PhoneNumberFormatter(phoneNumber).format({type: 'domestic'}).string;
            } catch(error) {
              console.error(error);
            }
            return `${row.user?.name} P# ${row.user?.member.pNumber} ${phoneNumber}`;
          }
          return 'Not Assigned';
        },
      },
      {
        id: 'createdBy.member.pNumber',
        label: 'Created By',
        width: 100,
        columnType: 'string',
        noSort: true,
      }
    ],
    filters: [
      {
        id: 'includeRemoved',
        type: 'hidden',
        defaultValue: true,
        value: true,
      },
      {
        id: 'range',
        type: 'dateRange',
        dateRangeType: 'start',
      },
      {
        id: 'refNumber',
        type: 'number',
        label: 'Shift Ref #',
      },
      {
        id: 'status',
        type: 'select',
        label: 'Status',
        async fetchOptions () {
          const formattedOptions = [
            {
              label: 'Assigned',
              value: ShiftStatus.Assigned,
            },
            {
              label: 'Available',
              value: ShiftStatus.Available,
            },
            {
              label: 'Locked',
              value: ShiftStatus.Locked,
            },
            {
              label: 'Relinquished',
              value: ShiftStatus.Relinquished,
            },
            {
              label: 'Removed',
              value: ShiftStatus.Removed,
            },
            {
              label: 'Unassigned',
              value: ShiftStatus.Unassigned,
            },
          ];
          // eslint-disable-next-line react/no-this-in-sfc
          this.calculatedOptions = formattedOptions;
          return formattedOptions;
        },
      },
      {
        id: 'daysOfWeek',
        type: 'select',
        label: 'Day',
        async fetchOptions () {
          const formattedOptions = [
            {
              label: 'Monday',
              value: DayOfWeek.Monday,
            },
            {
              label: 'Tuesday',
              value: DayOfWeek.Tuesday,
            },
            {
              label: 'Wednesday',
              value: DayOfWeek.Wednesday,
            },
            {
              label: 'Thursday',
              value: DayOfWeek.Thursday,
            },
            {
              label: 'Friday',
              value: DayOfWeek.Friday,
            },
            {
              label: 'Saturday',
              value: DayOfWeek.Saturday,
            },
            {
              label: 'Sunday',
              value: DayOfWeek.Sunday,
            },
          ];
          // eslint-disable-next-line react/no-this-in-sfc
          this.calculatedOptions = formattedOptions;
          return formattedOptions;
        },
      },
      {
        id: 'rankIds',
        type: 'select',
        label: 'Ranks',
        async fetchOptions () {
          const { data } = await client.query({
            query: GET_RANKS,
            variables: {
              input: {
                active: true,
                limit: 100000,
                skip: 0,
              },
            },
          });
          const formattedOptions = data?.ranks?.items?.map(({ id, name }: any) => ({ value: id, label: name })) || [];
          // eslint-disable-next-line react/no-this-in-sfc
          this.calculatedOptions = formattedOptions;
          return formattedOptions;
        },
      },
      {
        id: 'skillIds',
        type: 'select',
        label: 'Skills',
        async fetchOptions () {
          const { data } = await client.query({
            query: GET_SKILL_SLIM,
            variables: {
              input: {
                active: true,
                limit: 100000,
                skip: 0,
              },
            },
          });
          const formattedOptions = data?.skills?.items?.map(({ id, name }: any) => ({ value: id, label: name })) || [];
          // eslint-disable-next-line react/no-this-in-sfc
          this.calculatedOptions = formattedOptions;
          return formattedOptions;
        },
      },
      {
        id: 'createdById',
        type: 'autocomplete',
        label: 'Created By',
        autoComplete: {
          multiSelect: true,
          inputLabel: 'Created By',
          inputPlaceholder: 'Search...',
        },
        async fetchOptions (query?: string) {
          const { data } = await client.query({
            query: GET_USERS_SLIM,
            variables: {
              input: {
                query: query?.trim() === '' ? undefined : query?.trim(),
                admin: true,
                limit: 10,
                skip: 0,
              },
            },
          });
          const formattedOptions = data?.users?.items?.map(({ id, name }: any) => ({ value: id, label: name })) || [];
          return formattedOptions;
        },
      },
      {
        id: 'assignedIds',
        type: 'autocomplete',
        label: 'Assigned To',
        autoComplete: {
          multiSelect: true,
          inputLabel: 'Assigned To',
          inputPlaceholder: 'Search...',
        },
        async fetchOptions (query?: string) {
          const { data } = await client.query({
            query: GET_USERS_SLIM,
            variables: {
              input: {
                query: query?.trim() === '' ? undefined : query?.trim(),
                limit: 10,
                skip: 0,
              },
            },
          });
          const formattedOptions = data?.users?.items?.map(({ id, name }: any) => ({ value: id, label: name })) || [];
          return formattedOptions;
        },
      },
      {
        id: 'eventIds',
        type: 'autocomplete',
        label: 'Event Name or Ref',
        autoComplete: {
          multiSelect: true,
          inputLabel: 'Event Name or Ref',
          inputPlaceholder: 'Search...',
        },
        async fetchOptions (query?: string) {
          const { data } = await client.query({
            query: GET_ALL_EVENTS_SLIM,
            variables: {
              input: {
                query,
                limit: 10,
                skip: 0,
              },
            },
          });
          const formattedOptions = data?.events?.items?.map(({ id, name, referenceId }: any) => ({ value: id, label: `${name} (Ref #${referenceId})` })) || [];
          return formattedOptions;
        },
      },
    ]
  };

  return <GQLTable config={config} />
}
