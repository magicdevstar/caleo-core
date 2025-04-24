// @mui
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
// hooks
import { useParams, useRouter } from 'src/routes/hooks';
// components
import Iconify from 'src/components/iconify';
import CheckInOut from 'src/components/shifts/check-in-out';
// types
import { paths } from 'src/routes/paths';

export default function EventUserKioskView() {
  const router = useRouter();
  const params = useParams();

  const back = () => {
    router.push(
      paths.kiosk.root
      .replace(':eventId', params.eventId!)
    );
  }

  return (
    <Container
      maxWidth="lg"
      component="main"
      sx={{
        height: 'calc(100vh - 80px)',
        flexDirection: 'column',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, width: '100%' }}>
        <IconButton onClick={back} color='default'>
          <Iconify icon="ic:round-keyboard-arrow-left" />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <CheckInOut
            userId={params.userId}
            eventId={params.eventId}
            onSuccess={() => back()}
            emptyView={
              <Stack spacing={2}>
                <Typography variant='h4' component='h2'>No shifts found!</Typography>
                <Typography variant='subtitle1' component='p'>
                  You might be here too early or you have taken action on all of your shifts.
                </Typography>
              </Stack>
            }
          />
        </Box>
      </Box>
    </Container>
  )
}
