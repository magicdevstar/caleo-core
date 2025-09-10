import { useMemo } from 'react';
// @mui
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { SxProps } from '@mui/system';
import { Theme } from '@mui/material/styles/createTheme';
// hooks
import { useFeatures } from 'src/hooks/use-features';
// components
import Iconify from 'src/components/iconify';
import { Shift } from 'src/__generated__/resolvers-types';
import PolygonDrawMap from 'src/components/map/map-polygon';

// ----------------------------------------------------------------------

export type CheckInOutItemProps = {
  shift: Shift;
  mapSx?: SxProps<Theme>;
  onClick: (shift: Shift) => void;
  ignoreGeoFence?: boolean;
};

export default function CheckInOutItem({ shift, mapSx, onClick, ignoreGeoFence }: CheckInOutItemProps) {
  const { eventCheckIn } = useFeatures();
  const geoDetails = useMemo(() => {
    const coords = shift.assignment?.allowOfficerCheckIn ? shift.assignment?.geoFence || shift.event?.geoFence : shift.event?.geoFence;
    const requiresSpecificLocation = shift.assignment?.allowOfficerCheckIn || shift.event?.allowOfficerCheckIn;

    return {
      coords,
      requiresSpecificLocation,
    };
  }, [shift]);
  const isCheckOut = shift.shiftCheckInOut?.checkInTime || !eventCheckIn;
  const action = (
    <Stack
      spacing={1}
      direction="row"
    >
      <Button
        onClick={() => {
          onClick?.(shift);
        }}
        size="small"
        variant="contained"
        sx={{
          flexShrink: 0,
          minWidth: 'auto',
          whiteSpace: 'nowrap',
          px: 2,
        }}
      >
        {isCheckOut ? 'Check Out' : 'Check In'}
      </Button>
      <Typography variant='caption' color="textSecondary" component="p">You can remotely check in now! Your location will be shared to confirm you’re within the check-in/out boundaries.</Typography>
    </Stack>
  );

  return (
    <Stack
      spacing={2}
      sx={{
        mt: 1,
        p: 3,
        position: 'relative',
        minHeight: 220,
        justifyContent: 'space-between',
      }}
    >
      <Box>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              bgcolor: 'background.neutral',
            }}
          >
            {isCheckOut ? <Iconify icon="solar:logout-2-bold-duotone" /> : <Iconify icon="solar:login-2-bold-duotone" />}
          </Stack>

          <ListItemText
            primary={`${isCheckOut ? 'Check Out' : 'Check In'}: ${shift?.event?.name}`}
            secondary={shift?.assignment?.name}
            secondaryTypographyProps={{
              component: 'span',
              typography: 'caption',
              mt: 0.5,
              color: 'text.disabled',
            }}
          />
        </Stack>

        {
          geoDetails.requiresSpecificLocation && !ignoreGeoFence ? (
            <PolygonDrawMap
              initialPolygon={geoDetails.coords as [number, number][]}
              disabled
              hideAttributionControl
              sx={mapSx || { height: 100, mt: 1 }}
            />
          ) : (
            <Typography variant="body2" color="textSecondary" sx={{ m: 0 }}>
              Are you ready to {isCheckOut ? 'check out' : 'check in'} of {shift?.event?.name} - {shift?.assignment?.name}
            </Typography>
          )
        }
      </Box>

      {action}
    </Stack>
  );
}
