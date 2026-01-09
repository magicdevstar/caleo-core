import { useMemo } from 'react';
import { ApolloQueryResult } from '@apollo/client';
// @mui
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Button from '@mui/material/Button';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
import parsePhoneNumber from 'libphonenumber-js';
import { useAuthContext } from 'src/auth/hooks';
import { convertDate, useDateFormats } from 'src/hooks/use-datejs';
// components
import Iconify from 'src/components/iconify';
import { Shift } from 'src/__generated__/resolvers-types';
import { BooleanCell, DateCell, StringCell } from 'src/components/table/gql/row';
import { docusignStatusColor } from 'src/utils/docusign';
import { useFeatures } from 'src/hooks/use-features';
import { ShiftOverviewDialog } from 'src/components/shifts/overview/shift-overview-dialog';
import { ShiftData } from 'src/api/shifts';
import { IShiftTableHead } from './types';

// ----------------------------------------------------------------------

type Props = {
  row: Shift;
  header: IShiftTableHead[];
  refetch: () => Promise<ApolloQueryResult<ShiftData>>;
};

export default function Row({
  row,
  header,
  refetch,
}: Props) {
  const { timeFormat } = useDateFormats();
  const { user } = useAuthContext();
  const { customizableShiftId, docusignCheckout } = useFeatures();
  const confirm = useBoolean<Shift>();
  const parsed = parsePhoneNumber(row.user?.member?.contactInfo?.primaryPhone?.number || '', 'US');
  const mappedHeader = useMemo(() => header.reduce<Record<string, true>>((acc, curr) => {
    acc[curr.id] = true;
    return acc;
  }, {}), [header]);
  const hour18Time = useMemo(() => {
      if (!row?.shiftCheckInOut?.checkInTime) {
        return 'N/A';
      }
      return convertDate({
        date: new Date(row?.shiftCheckInOut?.checkInTime),
        user
      }).add(18, 'hour').format(timeFormat);
    }, [row, timeFormat, user]);

  return (
    <>
      <TableRow hover>
        {(mappedHeader.customId || mappedHeader.refNumber) && <StringCell value={customizableShiftId ? `${row.customId}` : `${row.refNumber}`} />}
        {mappedHeader.callSign && <StringCell value={row.callSign || row.assignment.callSign || '-'} />}
        {mappedHeader['assignment.name'] && <StringCell value={row.assignment?.name || '-'} />}
        {mappedHeader['user.name'] && <StringCell value={row.user?.name || '-'} />}
        {mappedHeader['user.member.rank.name'] && <StringCell labelColor={row.user?.member?.rank?.name ? 'primary' : 'default'} value={row.user?.member?.rank?.name || '-'} />}
        {mappedHeader['user.member.pNumber'] && <StringCell value={row.user?.member?.pNumber || '-'} />}
        {mappedHeader['user.member.contactInfo.primaryPhone.number'] && <StringCell href={`tel:${parsed?.number}`} value={parsed?.format?.("NATIONAL") || '-'} />}
        {mappedHeader['docusignEvent.status'] && docusignCheckout && <StringCell labelColor={docusignStatusColor(row.docusignEvent?.status)} value={row.docusignEvent?.status || '-'} />}
        {mappedHeader['shiftCheckInOut.noShow'] && <BooleanCell value={!!row.shiftCheckInOut?.noShow} />}
        {mappedHeader['shiftCheckInOut.adminNotes'] && <BooleanCell value={row.hasComments} />}
        {mappedHeader.hour18 && <StringCell value={hour18Time} />}
        {mappedHeader.startTime && <DateCell value={row.startTime} />}
        <TableCell align="right" sx={{ px: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              confirm.onTrue(row);
            }}
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            Edit Details
          </Button>
        </TableCell>
      </TableRow>

      <ShiftOverviewDialog
        isAdminView
        closeOnSave
        controller={confirm}
        refetch={refetch}
      />
    </>
  );
}
