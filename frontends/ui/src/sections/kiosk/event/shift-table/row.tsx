// @mui
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Button from '@mui/material/Button';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
import parsePhoneNumber from 'libphonenumber-js';
// components
import Iconify from 'src/components/iconify';
import { Shift } from 'src/__generated__/resolvers-types';
import { BooleanCell, DateCell, StringCell } from 'src/components/table/gql/row';
import { docusignStatusColor } from 'src/utils/docusign';
import { EditCheckInOut } from 'src/components/shifts/edit-check-in-out';
import { useFeatures } from 'src/hooks/use-features';

// ----------------------------------------------------------------------

type Props = {
  row: Shift;
};

export default function Row({
  row,
}: Props) {
  const { customizableShiftId, docusignCheckout } = useFeatures();
  const confirm = useBoolean();
  const parsed = parsePhoneNumber(row.user?.member?.contactInfo?.primaryPhone?.number || '', 'US');

  return (
    <>
      <TableRow hover>
        <StringCell value={customizableShiftId ? `${row.customId}` : `${row.refNumber}`} />
        <StringCell value={row.callSign || row.assignment.callSign || '-'} />
        <StringCell value={row.user?.name || '-'} />
        <StringCell labelColor={row.user?.member?.rank?.name ? 'primary' : 'default'} value={row.user?.member?.rank?.name || '-'} />
        <StringCell value={row.user?.member?.pNumber || '-'} />
        <StringCell value={parsed?.format?.("NATIONAL") || '-'} />
        {docusignCheckout && <StringCell labelColor={docusignStatusColor(row.docusignEvent?.status)} value={row.docusignEvent?.status || '-'} />}
        <BooleanCell value={!!row.shiftCheckInOut?.noShow} />
        <BooleanCell value={row.hasComments} />
        <DateCell value={row.startTime} />
        <TableCell align="right" sx={{ px: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              confirm.onTrue();
            }}
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            Edit Details
          </Button>
        </TableCell>
      </TableRow>

      <EditCheckInOut
        shift={row!}
        editCheckInOutModal={confirm}
        closeOnSave
        handleClose={() => {
          confirm.onFalse();
        }}
      />
    </>
  );
}
