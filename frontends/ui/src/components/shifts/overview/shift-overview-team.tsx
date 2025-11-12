import { useMemo } from 'react';
import PhoneNumberFormatter from 'phone-number-formats';
// @mui
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
// types
import { GET_SKILL_SLIM } from 'src/api/skill';
import { Assignment, Event, User } from 'src/__generated__/resolvers-types';
import { TableConfig } from 'src/components/table/table-config';
// hooks
import { useAuthContext } from 'src/auth/hooks';
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
  const { user } = useAuthContext();
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
    fieldSupervisorAssignment?.shifts?.[0]?.callSign || fieldSupervisorAssignment?.callSign || 'N/A', [fieldSupervisorAssignment]);

  const supervisorName = useMemo(() => {
    const superId = overrideSupervisor?.id || fieldSupervisorAssignment?.shifts?.[0]?.user?.id;
    const name = overrideSupervisor?.name || fieldSupervisorAssignment?.shifts?.[0]?.user?.name;
    const isSelf = user?.id === superId;
    return `${name}${isSelf ? ' (Me)' : ''}`;
  }, [overrideSupervisor, fieldSupervisorAssignment, user]);

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
    () => {
      // Show all direct reports
      if (assignment?.isSigningAuthority) {
        const authorityId = assignment?.fieldSupervisorAssignment?.shifts?.[0]?.user?.id!;
        return (event?.assignments || []).reduce((acc, assign, i) => {
          let sup: User | null | undefined = assign?.useFieldSupervisorAssignmentOverride ? event?.overrideSupervisor : null;
          if (!sup) {
            sup = assign?.fieldSupervisorAssignment?.shifts?.[0]?.user || event?.fieldSupervisorAssignment?.shifts?.[0]?.user || null;
          }
          if (sup?.id === authorityId) {
            const team = (assign?.shifts || [])
            .filter((s) => !(!s?.user || s?.shiftCheckInOut?.noShow))
            .map((s, j) => {
              // create new direct report from shift
              const newReport = {
                id: `${s?.user?.id}-${i}-${j}`,
                name: s?.user?.name,
                image: s?.user?.image,
                callSign: s?.callSign || assign?.callSign || 'N/A',
                phone: s?.user?.member?.contactInfo?.primaryPhone?.number,
                formattedPhone: s?.user?.member?.contactInfo?.primaryPhone?.number,
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
              return newReport as DirectReportUser;
            });
            acc.push(...team);
          }
          return acc;
        }, [] as DirectReportUser[]);
      }
      return (assignment?.shifts || [])
      .filter((s) => !(!s?.user || s?.shiftCheckInOut?.noShow))
      .map((s, i) => {
        // create new direct report from shift
        const newReport = {
          id: `${s?.user?.id}-${i}`,
          name: s?.user?.name,
          image: s?.user?.image,
          callSign: s?.callSign || assignment?.callSign || 'N/A',
          phone: s?.user?.member?.contactInfo?.primaryPhone?.number,
          formattedPhone: s?.user?.member?.contactInfo?.primaryPhone?.number,
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
        return newReport as DirectReportUser;
      })
    }, [event, assignment]
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
