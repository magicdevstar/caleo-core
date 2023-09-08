import { format } from 'date-fns';
import get from 'lodash/get';
import { Link as RouterLink } from "react-router-dom";
// @mui
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
// components
import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
// types
import { TableConfig } from '../table-config';

// ----------------------------------------------------------------------

type Props = {
  row: any;
  index: number;
  selected: boolean;
  onSelectRow: VoidFunction;
  config: TableConfig<any>;
};

const BooleanCell = ({value, width,}: {width?: number | string; value: boolean;}) => (
  <TableCell width={width}>
    <Label variant="soft" color={(value && 'info') || 'default'}>
      {value ? 'Yes' : 'No'}
    </Label>
  </TableCell>
);

const DateCell = ({value, width, href}: {width?: number | string; value: string; href?: string;}) => {
  let output: any = value ? format(new Date(value), 'EEEEEE dd MMM yyyy') : 'N/A';
  let secondary: any = value ? format(new Date(value), 'p') : '';
  if (href) {
    secondary = (
      <Link
        noWrap
        component={RouterLink}
        color="inherit"
        variant="subtitle2"
        to={href}
        sx={{ cursor: 'pointer' }}
      >
        {secondary}
      </Link>
    );
    output = (
      <Link
        noWrap
        component={RouterLink}
        color="inherit"
        variant="subtitle2"
        to={href}
        sx={{ cursor: 'pointer' }}
      >
        {output}
      </Link>
    );
  }
  return (
    <TableCell width={width}>
      <ListItemText
        primary={output}
        secondary={secondary}
        primaryTypographyProps={{ typography: 'body2', noWrap: true }}
        secondaryTypographyProps={{
          mt: 0.5,
          component: 'span',
          typography: 'caption',
        }}
      />
    </TableCell>
  );
}

const StringCell = ({value, labelColor, href, onClick, width, clickable} : { width?: number | string; value: string; labelColor?: string; href?: string; onClick: any; clickable: boolean;}) => {
  if (href) {
    return (
      <TableCell width={width}>
        <ListItemText
          disableTypography
          primary={
            <Link
              noWrap
              component={RouterLink}
              color="inherit"
              variant="subtitle2"
              to={href}
              sx={{ cursor: 'pointer' }}
            >
              {value}
            </Link>
          }
        />
      </TableCell>
    );
  }
  if (labelColor) {
    return (
      <TableCell width={width}>
        <Label onClick={onClick} variant="soft" color={labelColor as any} sx={ clickable ? { cursor: 'pointer' } : {}}>
          {value}
        </Label>
      </TableCell>
    )
  }
  return (
    <TableCell width={width}>
      <Typography variant="subtitle2" noWrap color="inherit">
        {value}
      </Typography>
    </TableCell>
  );
};

const ArrayCell = ({value, width, maxRender} : {width?: number | string; value: string[]; maxRender: number;}) => (
  <TableCell width={width}>
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
  index,
  onSelectRow,
  config,
}: Props) {
  const popover = usePopover();
  return (
    <>
      <TableRow hover selected={selected}>
        {
          config.columns.map((column) => {
            const value = column.renderValue ? column.renderValue(get(row, column.id), index) : get(row, column.id);
            switch(column.columnType) {
              case 'boolean':
                return (<BooleanCell width={column.width} key={column.id} value={value} />);
              case 'date':
                return (<DateCell width={column.width} key={column.id} value={value} href={column.getHref?.(row)} />);
              case 'string':
                return (<StringCell width={column.width} key={column.id} value={value} href={column.getHref?.(row)} clickable={!!column?.clickable?.(row)} onClick={() => column.onClick?.(row)} labelColor={column.getLabelColor?.(row)} />);
              case 'array': 
                return (<ArrayCell width={column.width} key={column.id} value={value} maxRender={column.maxRender || 1} />);
              case 'action': 
              default:
                return (
                  <TableCell key={column.id} align="right" width={column.width}>
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
            disabled={action.getDisabled?.(row) || false}
            onClick={() => {
              action.onClick(row);
              popover.onClose();
            }}
          >
            <Iconify icon={action.getIcon(row)} {...(action.getColor ? { sx: { color: action.getColor(row) } } : {})} />
            {action.getName(row)}
          </MenuItem>
        ))}
      </CustomPopover>
    </>
  );
}
