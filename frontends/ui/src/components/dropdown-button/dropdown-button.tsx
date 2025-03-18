import * as React from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Iconify from '../iconify';

export interface DropDownButtonProps {
  text: string;
  buttonClick: (event: React.MouseEvent<HTMLElement>) => any;
  menuItems: {
    key: string;
    text: string;
    icon: string;
    onClick: (event: React.MouseEvent<HTMLElement>) => any;
  }[]
}

export default function DropDownButton({
  text,
  menuItems,
  buttonClick,
}: DropDownButtonProps) {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button
        aria-controls={open ? 'drop-down-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        variant="contained"
        sx={{ padding: '0 12px', paddingRight: '0' }}
        disableElevation
        onClick={buttonClick}
        endIcon={
          <>
            <Divider sx={{ height: '35px' }} orientation='vertical' />
            <IconButton sx={{ height: '35px', padding: '0 8px', paddingRight: '12px' }} onClick={handleClick} color='default'>
              <Iconify icon="ic:round-keyboard-arrow-down" />
            </IconButton>
          </>
        }
      >
        {text}
      </Button>
      <Menu
        MenuListProps={{
          'aria-labelledby': 'demo-customized-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {
          menuItems.map((item) => (
            <MenuItem
              key={item.key}
              onClick={(e) => {
                setAnchorEl(null);
                item.onClick(e);
              }}
              disableRipple
            >
              <Iconify icon={item.icon} />
              {item.text}
            </MenuItem>
          ))
        }
      </Menu>
    </div>
  );
}
