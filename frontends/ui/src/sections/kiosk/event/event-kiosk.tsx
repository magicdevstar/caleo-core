import { useCallback, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useSnackbar } from 'src/components/snackbar';
// @mui
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Stack from "@mui/system/Stack";
import LoadingButton from "@mui/lab/LoadingButton";
// hooks
import { usePNumberLabel } from "src/hooks/use-pNumber-label";
// types
import { Event } from "src/__generated__/resolvers-types";
import { GET_USERS } from "src/api/user";
import { paths } from "src/routes/paths";
import { useRouter } from "src/routes/hooks";

export default function EventKiosk({
  event,
  eventId,
}: {
  event?: Event;
  eventId: string;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const router = useRouter();
  const [pNumber, setPNumber] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const { pNumberLabel } = usePNumberLabel();
  const [findUser] = useLazyQuery(GET_USERS);

  const handleSearch = useCallback(async () => {
    try {
      setSearching(true);
      const { data } = await findUser({
        variables: {
          input: {
            exactPNumber: pNumber,
            limit: 1,
          },
        },
      });
      if (data.users.items.length === 0) {
        throw new Error('User not found');
      }
      const user = data.users.items[0];
      router.push(
        paths.kiosk.userView
        .replace(':eventId', eventId)
        .replace(':userId', user.id)
      );
    } catch (error) {
      enqueueSnackbar('User not found. Please try again.', { variant: 'error' });
    } finally {
      setSearching(false);
    }
  }, [
    router,
    findUser,
    enqueueSnackbar,
    pNumber,
    eventId,
  ]);

  return (
    <Stack spacing={2} sx={{ width: '100%' }}>
      <Typography variant="h4" component="h1" gutterBottom>{event?.name}: Check-in/out</Typography>
      <TextField
        label={pNumberLabel}
        fullWidth
        inputMode="numeric"
        onChange={(e) => setPNumber(e.target.value)}
      />
      <LoadingButton
        loading={searching}
        variant="contained"
        color="primary"
        onClick={handleSearch}
      >View Event Shifts</LoadingButton>
    </Stack>
  );
}
