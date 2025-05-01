// @mui
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Button from '@mui/material/Button';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
import parsePhoneNumber from 'libphonenumber-js';
// components
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { DocusignSignerDetails, Shift } from 'src/__generated__/resolvers-types';
import { BooleanCell, DateCell, StringCell } from 'src/components/table/gql/row';
import { docusignStatusColor } from 'src/utils/docusign';
import { EditCheckInOut } from 'src/components/shifts/edit-check-in-out';
import { ApolloQueryResult } from '@apollo/client';
import { ShiftData } from 'src/api/shifts';

// ----------------------------------------------------------------------

type Props = {
  row: Shift;
  onDocusignReminder: VoidFunction;
  refetch: () => Promise<ApolloQueryResult<ShiftData>>;
};

const docusignOfficerStatus = (signerDetails: DocusignSignerDetails[] | null) =>
  signerDetails?.find((signer) => signer.roleName === 'Officer')?.status;

export default function Row({
  row,
  onDocusignReminder,
  refetch,
}: Props) {
  const confirm = useBoolean();
  const popover = usePopover();
  const parsed = parsePhoneNumber(row.user?.member?.contactInfo?.primaryPhone?.number || '', 'US');

  return (
    <>
      <TableRow hover>
        <StringCell value={`${row.refNumber}`} />
        <StringCell value={row.user?.name || '-'} />
        <StringCell labelColor={row.user?.member?.rank?.name ? 'primary' : 'default'} value={row.user?.member?.rank?.name || '-'} />
        <StringCell value={row.user?.member?.pNumber || '-'} />
        <StringCell value={parsed?.format?.("NATIONAL") || '-'} />
        <StringCell labelColor={docusignStatusColor(row.docusignEvent?.status)} value={row.docusignEvent?.status || '-'} />
        <BooleanCell value={!!row.shiftCheckInOut?.noShow} />
        <DateCell value={row.startTime} />
        <TableCell align="right" sx={{ px: 1 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            startIcon={<Iconify icon="solar:pen-bold" />}
          >
            Edit Check in/out
          </Button>
          {/* <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton> */}
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 200 }}
      >
        <MenuItem
          disabled={!row.shiftCheckInOut?.checkInTime}
          onClick={() => {
            confirm.onTrue();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit Check in/out
        </MenuItem>
        <MenuItem
          disabled={
            !row.docusignEvent ||
            docusignOfficerStatus(row.docusignEvent.signerDetails!)?.toUpperCase() !== 'SENT'
          }
          onClick={() => {
            onDocusignReminder();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:eye-bold" />
          Resend Docusign
        </MenuItem>
      </CustomPopover>

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
