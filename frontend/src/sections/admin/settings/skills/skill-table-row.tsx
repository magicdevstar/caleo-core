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
// hooks
import { useBoolean } from 'src/hooks/use-boolean';
// components
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
// types
import { Skill } from 'src/__generated__/resolvers-types';

// ----------------------------------------------------------------------

const MAX_RANKS = 3;

type Props = {
  row: Skill;
  selected: boolean;
  onEditRow: VoidFunction;
  onToggleActivation: (active: boolean) => void;
  onSelectRow: VoidFunction;
  onDeleteRow: VoidFunction;
};

export default function SkillTableRow({
  row,
  selected,
  onSelectRow,
  onToggleActivation,
  onDeleteRow,
  onEditRow,
}: Props) {
  const {
    name,
    active,
    requiresAdminApproval,
    requiresCert,
    ranksOnly,
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
          {!ranksOnly || (ranksOnly || []).length === 0 ? (
            <Label variant="soft" color="info">
              All
            </Label>
          ) :
            (
              <>
                {
                  (ranksOnly || []).slice(0, MAX_RANKS).map((rank: any) => (
                    <Label key={rank.id} sx={{ mb: 1, mr: 1 }} variant="soft" color="info">
                      {rank.name}
                    </Label>
                  ))
                }
                {
                  (ranksOnly || []).length > MAX_RANKS && (
                    <Label sx={{ mb: 1, mr: 1 }} variant="soft" color="info">
                      + {((ranksOnly || []).length - 1)} more
                    </Label>
                  )
                }
              </>
            )
          }
        </TableCell>

        <TableCell>
          <Label variant="soft" color={(requiresCert && 'info') || 'default'}>
            {requiresCert ? 'Yes' : 'No'}
          </Label>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={(requiresAdminApproval && 'info') || 'default'}>
            {requiresAdminApproval ? 'Yes' : 'No'}
          </Label>
        </TableCell>

        <TableCell>
          <Label variant="soft" color={(active && 'info') || 'default'}>
            {active ? 'Active' : 'InActive'}
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
            onToggleActivation(!active);
            popover.onClose();
          }}
        >
          <Iconify icon={active ? "solar:close-circle-bold" : "solar:check-circle-bold"} />
          {active ? 'Deactivate' : 'Activate'}
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
