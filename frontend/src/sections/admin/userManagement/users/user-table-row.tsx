import { format } from 'date-fns';
// @mui
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
// types
import { MemberStatus, User } from 'src/__generated__/resolvers-types';

// ----------------------------------------------------------------------

type Props = {
  row: User;
  selected: boolean;
  onEditRow: VoidFunction;
  onToggleActivation: (active: boolean) => void;
  onSelectRow: VoidFunction;
  onDeleteRow: VoidFunction;
};

export default function UserTableRow({
  row,
  selected,
  onSelectRow,
  onToggleActivation,
  onDeleteRow,
  onEditRow,
}: Props) {
  const {
    name,
    member: {
      status,
      tier,
      pNumber,
      rank,
    },
    createdAt,
  } = row;

  const confirm = useBoolean();

  const popover = usePopover();
  return (
    <>
      <TableRow hover selected={selected}>
        <TableCell padding="checkbox">
          <Checkbox checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Typography variant="subtitle2" noWrap color="inherit">
            {name}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="subtitle2" noWrap color="inherit">
            {pNumber}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="subtitle2" noWrap color="inherit">
            {tier?.toLowerCase()}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="subtitle2" noWrap color="inherit">
            {rank?.name}
          </Typography>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={(status === MemberStatus.Active && 'info') || 'default'}>
            {status?.toLowerCase()}
          </Label>
        </TableCell>

        <TableCell>
          <ListItemText
            primary={format(new Date(createdAt), 'dd MMM yyyy')}
            secondary={format(new Date(createdAt), 'p')}
            primaryTypographyProps={{ typography: 'body2', noWrap: true }}
            secondaryTypographyProps={{
              mt: 0.5,
              component: 'span',
              typography: 'caption',
            }}
          />
        </TableCell>

        <TableCell align="right">
          <IconButton color={popover.open ? 'primary' : 'default'} onClick={popover.onOpen}>
            <Iconify icon="eva:more-vertical-fill" />
          </IconButton>
        </TableCell>
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        <MenuItem
          onClick={() => {
            onEditRow();
            popover.onClose();
          }}
        >
          <Iconify icon="solar:pen-bold" />
          Edit
        </MenuItem>

        <MenuItem
          onClick={() => {
            onToggleActivation(false);
            popover.onClose();
          }}
        >
          <Iconify icon="solar:check-circle-bold" />
          Activate
        </MenuItem>

        <MenuItem
          onClick={() => {
            confirm.onTrue();
            popover.onClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" />
          Delete
        </MenuItem>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content="Are you sure want to delete?"
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            Delete
          </Button>
        }
      />
    </>
  );
}
