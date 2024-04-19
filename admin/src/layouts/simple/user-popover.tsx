import { m } from 'framer-motion';
// @mui
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
// routes
import { useRouter } from 'src/routes/hooks';
// auth
import { useAuthContext } from 'src/auth/hooks';
// components
import { varHover } from 'src/components/animate';
import CustomPopover, { usePopover } from 'src/components/custom-popover';
import { useSettingsContext } from 'src/components/settings';
import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

export default function UserPopover() {
  const router = useRouter();

  const { themeMode, onUpdate } = useSettingsContext();

  const { logout, user } = useAuthContext();

  const popover = usePopover();

  const handleLogout = async () => {
    try {
      await logout();
      popover.onClose();
      router.replace('/');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={popover.onOpen}
        sx={{
          width: 40,
          height: 40,
          background: (theme) => alpha(theme.palette.grey[500], 0.08),
          ...(popover.open && {
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
          }),
        }}
      >
        <Avatar
          src={user?.photoURL}
          alt={user?.displayName}
          sx={{
            width: 36,
            height: 36,
            border: (theme) => `solid 2px ${theme.palette.background.default}`,
          }}
        />
      </IconButton>

      <CustomPopover open={popover.open} onClose={popover.onClose} sx={{ width: 200, p: 0 }}>
        <Box sx={{ p: 2, pb: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {user?.displayName}
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {user?.email}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuItem
          sx={{ m: 1 }}
          onClick={() => {
            onUpdate('themeMode', themeMode === 'light' ? 'dark' : 'light');
            onUpdate('themeContrast', themeMode === 'light' ? 'default' : 'bold');
          }}
        >
          <ListItemIcon sx={{ margin: 0 }}>
            <Iconify
              sx={{ margin: 0 }}
              icon={themeMode === 'dark' ? 'ic:round-light-mode' : 'ic:round-nightlight'}
            />
          </ListItemIcon>
          <ListItemText>{themeMode === 'dark' ? 'Light theme' : 'Dark theme'}</ListItemText>
        </MenuItem>

        <Divider sx={{ borderStyle: 'dashed', marginTop: '8px !important' }} />

        <MenuItem
          onClick={handleLogout}
          sx={{ m: 1, fontWeight: 'fontWeightBold', color: 'error.main' }}
        >
          <ListItemIcon sx={{ margin: 0 }}>
            <Iconify sx={{ margin: 0 }} icon="ic:baseline-logout" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </CustomPopover>
    </>
  );
}
