import { useMemo } from 'react';
import PhoneNumberFormatter from 'phone-number-formats';
// @mui
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
// types
import { GET_SKILL_SLIM } from 'src/api/skill';
import { Assignment, Event } from 'src/__generated__/resolvers-types';
import { TableConfig } from 'src/components/table/table-config';
// components
import GQLTable from 'src/components/table/gql/table';
import ShiftOverviewDetail from './shift-overview-detail';

export interface DirectReportUser {
  image?: string;
  name?: string;
  callSign?: string;
  phone?: string;
  formattedPhone?: string;
};

interface Props {
  event?: Event;
  assignment?: Assignment;
};

export default function ShiftOverviewTeam({ event, assignment }: Props) {
  const overrideSupervisor = useMemo(() => {
    if (!assignment?.useFieldSupervisorAssignmentOverride) {
      return null;
    }
    return event?.overrideSupervisor;
  }, [assignment, event]);

  const fieldSupervisorAssignment = useMemo(() =>
    assignment?.fieldSupervisorAssignment || event?.fieldSupervisorAssignment,
  [assignment, event]);

  const supervisorCallSign = useMemo(() =>
    fieldSupervisorAssignment?.shifts?.[0]?.callSign || 'N/A', [fieldSupervisorAssignment]);

  const supervisorName = useMemo(() =>
    overrideSupervisor?.name || fieldSupervisorAssignment?.shifts?.[0]?.user?.name, [overrideSupervisor, fieldSupervisorAssignment]);

  const supervisorPhone = useMemo(() => {
    const phone = overrideSupervisor?.member?.contactInfo?.primaryPhone?.number || fieldSupervisorAssignment?.shifts?.[0]?.user?.member?.contactInfo?.primaryPhone?.number;
    let formattedNumber = phone;
    if (phone) {
      try {
        formattedNumber = new PhoneNumberFormatter(phone).format({
          type: 'domestic',
        }).string;
      } catch (error) {
        console.error(error);
      }
    }
    return {
      phone,
      formatted: formattedNumber
    }
  }, [overrideSupervisor, fieldSupervisorAssignment])

  const directReports = useMemo(
    () =>
      // iterate through all shifts within each assignment for direct reporters
      (event?.assignments || []).reduce((acc, assign, i) => {
        // skip supervisor assignments
        if (assign.isSigningAuthority) {
          return acc;
        }

        // iterate through all shifts in each assignment
        assign.shifts?.forEach((shift: any, j) => {
          // skip any direct reports that are not assigned or no show
          if (!shift?.user || shift?.shiftCheckInOut?.noShow) {
            return;
          }

          // create new direct report from shift
          const newReport = {
            id: `${shift?.user?.id}-${i}-${j}`,
            name: shift?.user?.name,
            image: shift?.user?.image,
            callSign: shift?.callSign || assign.callSign || 'N/A',
            phone: shift?.user?.member?.contactInfo?.primaryPhone?.number,
            formattedPhone: shift?.user?.member?.contactInfo?.primaryPhone?.number,
          };

          // try to format number
          if (newReport.phone) {
            try {
              const formattedNumber = new PhoneNumberFormatter(newReport.phone)?.format?.({
                type: 'domestic',
              })?.string;
              newReport.formattedPhone = formattedNumber;
            } catch (_error) {} // eslint-disable-line no-empty
          }
          // push new report
          acc.push(newReport);
        });

        return acc;
      }, [] as DirectReportUser[]),
    [event]
  );

  const commentTableConfig: TableConfig<DirectReportUser> = useMemo(() => ({
    header: {
      title: 'Team Members',
      titleSx: { p: 0 },
      buttons: [],
    },
    table: {
      sx: {
        minWidth: 'inherit',
      }
    },
    search: {
      data: (directReports || []),
      query: GET_SKILL_SLIM,
      processResult: (data) => ({
        items: data,
        total: data.length,
      }),
    },
    rowActions: [],
    columns: [
      {
        id: 'name',
        label: 'Name',
        columnType: 'string',
      },
      {
        id: 'callSign',
        label: 'Call Sign',
        columnType: 'string',
      },
      {
        id: 'formattedPhone',
        label: 'Contact Number',
        columnType: 'string',
        getHref: (row) => `tel:${row.phone}`,
      },
    ],
    filters: []
  }), [directReports]);

  return (
    <Stack>
      <Grid container spacing={2}>
        <ShiftOverviewDetail
          label="Field Supervisor Name"
          value={supervisorName}
        />
        <ShiftOverviewDetail
          label="Field Supervisor Call Sign"
          value={supervisorCallSign}
        />
        <ShiftOverviewDetail label="Field Supervisor Contact Number">
          <Link variant="body2" color={(theme) => theme.palette.info.main} underline="hover" href={`tel:${supervisorPhone.phone}`}>
            {supervisorPhone.formatted}
          </Link>
        </ShiftOverviewDetail>
      </Grid>
      <GQLTable config={commentTableConfig} />
    </Stack>
  );
}
