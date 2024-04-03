// @mui
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
// components
import Scrollbar from 'src/components/scrollbar';
import Iconify from 'src/components/iconify';

export default function RecentNotificationSkeleton() {
  return (
    <Stack
      spacing={2}
      sx={{
        mt: 1,
        p: 3,
        position: 'relative',
        minHeight: 220,
      }}
    >
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
          <Skeleton variant="circular" sx={{ width: 24, height: 24 }} />
        </Stack>

        <Stack flexGrow={1}>
          <Skeleton variant="text" sx={{ maxWidth: '50%', fontSize: '1rem' }} />
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            <Skeleton variant="text" sx={{ maxWidth: '25%', fontSize: '0.8rem' }} />
          </Typography>
        </Stack>
      </Stack>

      <Scrollbar sx={{ maxHeight: '4lh', px: 0.5 }}>
        <Typography component="div" variant="body2">
          <Stack>
            <Skeleton variant="text" sx={{ maxWidth: '85%', fontSize: '1rem' }} />
            <Skeleton variant="text" sx={{ maxWidth: '50%', fontSize: '1rem' }} />
          </Stack>
        </Typography>
      </Scrollbar>

      <Stack
        spacing={1}
        direction="row"
        justifyContent="space-between"
        flexWrap="wrap"
        alignItems="center"
      >
        <Skeleton variant="rectangular">
          <Button size="small" variant="contained">
            View Available Overtime
          </Button>
        </Skeleton>
        <Skeleton variant="circular">
          <IconButton>
            <Iconify
              icon="material-symbols:mark-email-read-outline"
              sx={{ width: 24, height: 24 }}
            />
          </IconButton>
        </Skeleton>
      </Stack>
    </Stack>
  );
}
