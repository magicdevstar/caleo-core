// @mui
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
// components
import Iconify from 'src/components/iconify';
import { Shift } from 'src/__generated__/resolvers-types';

// ----------------------------------------------------------------------

export type CheckInOutItemProps = {
  shift: Shift;
  onClick: (shift: Shift) => void;
};

export default function CheckInOutItem({ shift, onClick }: CheckInOutItemProps) {
  const action = (
    <Stack
      spacing={1}
      direction="row"
      justifyContent="space-between"
      flexWrap="wrap"
      alignItems="center"
    >
      <Button
        onClick={() => {
          onClick?.(shift);
        }}
        size="small"
        variant="contained"
      >
        {shift.shiftCheckInOut?.checkInTime ? 'Check Out' : 'Check In'}
      </Button>
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
            {shift.shiftCheckInOut?.checkInTime ? <Iconify icon="solar:logout-2-bold-duotone" /> : <Iconify icon="solar:login-2-bold-duotone" />}
          </Stack>

          <ListItemText
            primary={shift.shiftCheckInOut?.checkInTime ? 'Check Out' : 'Check In'}
            secondary={`${shift?.event?.name} - ${shift?.assignment?.name}`}
            secondaryTypographyProps={{
              component: 'span',
              typography: 'caption',
              mt: 0.5,
              color: 'text.disabled',
            }}
          />
        </Stack>

        <Typography variant="body2" color="textSecondary" sx={{ m: 0 }}>
          Are you ready to {shift.shiftCheckInOut?.checkInTime ? 'check out' : 'check in'} of {shift?.event?.name} - {shift?.assignment?.name}
        </Typography>
      </Box>

      {action}
    </Stack>
  );
}
