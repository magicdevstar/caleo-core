import { format } from 'date-fns';
import get from 'lodash/get';
// @mui
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
// components
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
// types
import { TableConfig } from '../table-config';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  selected: boolean;
  onSelectRow: VoidFunction;
  config: TableConfig<any>;
};

const BooleanCell = ({value}: {value: boolean;}) => (
  <TableCell>
    <Label variant="soft" color={(value && 'info') || 'default'}>
      {value ? 'Yes' : 'No'}
    </Label>
  </TableCell>
);

const DateCell = ({value}: {value: string;}) =>
  <TableCell>
    <ListItemText
      primary={format(new Date(value), 'dd MMM yyyy')}
      secondary={format(new Date(value), 'p')}
      primaryTypographyProps={{ typography: 'body2', noWrap: true }}
      secondaryTypographyProps={{
        mt: 0.5,
        component: 'span',
        typography: 'caption',
      }}
    />
  </TableCell>;

const StringCell = ({value, labelColor} : {value: string; labelColor?: string}) => (
  <TableCell>
    {
      labelColor ? (
        <Label variant="soft" color={labelColor as any}>
          {value}
        </Label>
      ) : (
        <Typography variant="subtitle2" noWrap color="inherit">
          {value}
        </Typography>
      )
    }
  </TableCell>
);

const ArrayCell = ({value, maxRender} : {value: string[]; maxRender: number}) => (
  <TableCell>
    {!value || (value || []).length === 0 ? (
      <Label variant="soft" color="info">
        All
      </Label>
    ) :
      (
        <>
          {
            (value || []).slice(0, maxRender).map((rank: any) => (
              <Label key={rank.id} sx={{ mb: 1, mr: 1 }} variant="soft" color="info">
                {rank.name}
              </Label>
            ))
          }
          {
            (value || []).length > maxRender && (
              <Label sx={{ mb: 1, mr: 1 }} variant="soft" color="info">
                + {((value || []).length - maxRender)}
              </Label>
            )
          }
        </>
      )
    }
  </TableCell>
);

export default function GQLTableRow({
  row,
  selected,
  onSelectRow,
  config,
}: Props) {
  const popover = usePopover();
  return (
    <>
      <TableRow hover selected={selected}>
        {
          config.columns.map((column) => {
            const value = column.renderValue ? column.renderValue(get(row, column.id)) : get(row, column.id);
            switch(column.columnType) {
              case 'boolean':
                return (<BooleanCell key={column.id} value={value} />);
              case 'date':
                return (<DateCell key={column.id} value={value} />);
              case 'string':
                return (<StringCell key={column.id} value={value} labelColor={column.getLabelColor?.(row)} />);
              case 'array': 
                return (<ArrayCell key={column.id} value={value} maxRender={column.maxRender || 1} />);
              case 'action': 
              default:
                return (
                  <TableCell key={column.id} align="right">
                    <IconButton color={popover.open ? 'primary' : 'default'} onClick={popover.onOpen}>
                      <Iconify icon="eva:more-vertical-fill" />
                    </IconButton>
                  </TableCell>
                );
            }
          })
        }
      </TableRow>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 140 }}
      >
        {config.rowActions.map((action) => (
          <MenuItem
            key={action.getName(row)}
            onClick={() => {
              action.onClick(row);
              popover.onClose();
            }}
          >
            <Iconify icon={action.getIcon(row)} />
            {action.getName(row)}
          </MenuItem>
        ))}
      </CustomPopover>
    </>
  );
}
