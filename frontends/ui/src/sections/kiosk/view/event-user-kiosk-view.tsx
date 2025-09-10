// @mui
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
// hooks
import { useParams, useRouter } from 'src/routes/hooks';
import { useBoolean } from 'src/hooks/use-boolean';
// components
import CheckInOut from 'src/components/shifts/check-in-out';
// types
import { CHECK_IN_OUT_STATUS } from "src/types/checkinout";
import { paths } from 'src/routes/paths';
import CheckInSuccess from '../user/checkin-success';

export default function EventUserKioskView() {
  const router = useRouter();
  const params = useParams();
  const completed = useBoolean<string>();

  const back = () => {
    router.push(
      paths.kiosk.root
      .replace(':eventId', params.eventId!)
    );
    completed.onFalse();
  }

  return (
    <Container
      maxWidth="lg"
      component="main"
      sx={{
        flexDirection: 'column',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {
        completed.value ? (
          <CheckInSuccess status={(completed.attribute as CHECK_IN_OUT_STATUS) || CHECK_IN_OUT_STATUS.CHECKED_IN} action={back} />
        ) : (
          <Stack spacing={2} direction="column" sx={{ width: '100%' }}>
            <CheckInOut
              ignoreGeoFence
              userId={params.userId}
              eventId={params.eventId}
              onSuccess={(status) => completed.onTrue(status)}
              emptyView={
                <Stack spacing={2}>
                  <Typography variant='h4' component='h2'>No shifts found!</Typography>
                  <Typography variant='subtitle1' component='p'>
                    You might be here too early or you have taken action on all of your shifts.
                  </Typography>
                </Stack>
              }
            />
            <Button size="large" variant="contained" onClick={back}>
              Start another check in/out
            </Button>
          </Stack>
        )
      }
    </Container>
  )
}
