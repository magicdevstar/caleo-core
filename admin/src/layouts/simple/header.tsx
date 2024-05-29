import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { useSnackbar } from 'notistack';
// @mui
import { useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import CircularProgress from '@mui/material/CircularProgress';
// theme
import { bgBlur } from 'src/theme/css';
// hooks
import { RESET_IMPERSONATION } from 'src/api/user';
import { useOffSetTop } from 'src/hooks/use-off-set-top';
import { useResponsive } from 'src/hooks/use-responsive';
import { useAuthContext } from 'src/auth/hooks';
// components
import Logo from 'src/components/logo';
import Label from 'src/components/label';
//
import { HEADER } from '../config-layout';
import UserPopover from './user-popover';

// ----------------------------------------------------------------------

export default function Header() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { impersonatingUser, user, refreshSession } = useAuthContext();

  const [resetImpersonation] = useMutation(RESET_IMPERSONATION);

  const lgUp = useResponsive('up', 'lg');

  const offset = useOffSetTop(HEADER.H_DESKTOP);

  const handleResetImpersonation = async () => {
    setLoading(true);
    try {
      await resetImpersonation();
      await refreshSession();
      enqueueSnackbar('Successfully reset impersonation', { autoHideDuration: 5000, variant: 'success' });
    } catch(error) {
      enqueueSnackbar('Failed to reset impersonation', { variant: 'error', autoHideDuration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  const renderContent = (
    <>
      <Logo sx={{ mr: 2.5 }} />

      {impersonatingUser && (
        <Label
          color="error"
          variant="filled"
          onClick={handleResetImpersonation}
          sx={{
            cursor: 'pointer',
            height: 'auto',
            fontSize: '14px',
            p: 1,
            textWrap: 'wrap',
            lineHeight: '14px'
          }}
        >
          {loading && <CircularProgress sx={{ mr: 1 }} size={12} thickness={5} color='inherit' />}
          {`Impersonating User: ${user.name}`}
        </Label>
      )}

      <Stack
        flexGrow={1}
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        spacing={{ xs: 0.5, sm: 1 }}
      >
        <UserPopover />
      </Stack>
    </>
  );

  return (
    <AppBar
      sx={{
        height: HEADER.H_MOBILE,
        zIndex: theme.zIndex.appBar + 1,
        ...bgBlur({
          color: theme.palette.background.default,
        }),
        transition: theme.transitions.create(['height'], {
          duration: theme.transitions.duration.shorter,
        }),
        ...(lgUp && {
          // width: 1,
          height: HEADER.H_DESKTOP,
          ...(offset && {
            height: HEADER.H_DESKTOP_OFFSET,
          }),
        }),
      }}
    >
      <Toolbar
        sx={{
          height: 1,
          px: { lg: 5 },
        }}
      >
        {renderContent}
      </Toolbar>
    </AppBar>
  );
}
