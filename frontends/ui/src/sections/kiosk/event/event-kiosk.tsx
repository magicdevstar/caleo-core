import { useCallback, useState } from "react";
import { useLazyQuery } from "@apollo/client";
import { useSnackbar } from 'src/components/snackbar';
import isEmpty from "lodash/isEmpty";
// @mui
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Stack from "@mui/system/Stack";
import LoadingButton from "@mui/lab/LoadingButton";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
// hooks
import { usePNumberLabel } from "src/hooks/use-pNumber-label";
// types
import { Event, User } from "src/__generated__/resolvers-types";
import { GET_USERS } from "src/api/user";
import { paths } from "src/routes/paths";
import { useRouter } from "src/routes/hooks";
import PhoneNumberPad from "src/components/kiosk/PhoneNumberPad";
import { useDeviceType } from "src/hooks/use-device-type";
import { useFeatures } from "src/hooks/use-features";
import { useBoolean } from "src/hooks/use-boolean";
// components
import LasdCompleteProfile from "src/sections/onboarding/views/lasd-profile";
import CompactLayout from "src/layouts/compact";

export default function EventKiosk({
  event,
  eventId,
}: {
  event?: Event;
  eventId: string;
}) {
  const { lasdUserFields } = useFeatures();
  const { isTouchDevice } = useDeviceType();
  const { enqueueSnackbar } = useSnackbar();
  const onboarding = useBoolean<{ path: string; user: User; }>();
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
      const shiftViewPath = paths.kiosk.userView
        .replace(':eventId', eventId)
        .replace(':userId', user.id);

      if (
        lasdUserFields &&
        (
          isEmpty(user.member.rank) ||
          isEmpty(user.member.unit) ||
          isEmpty(user.member.division) ||
          isEmpty(user.member.contactInfo?.primaryPhone?.number)
        )
      ) {
        onboarding.onTrue({
          path: shiftViewPath,
          user,
        });
        return;
      }

      router.push(shiftViewPath);
    } catch (error) {
      enqueueSnackbar('User not found. Please try again.', { variant: 'error' });
    } finally {
      setSearching(false);
    }
  }, [
    router,
    findUser,
    enqueueSnackbar,
    onboarding,
    lasdUserFields,
    pNumber,
    eventId,
  ]);

  return (
    <>
      <Stack spacing={2} sx={{ width: '100%' }}>
        <Typography variant="h4" component="h1" gutterBottom>{event?.name}: Check-in/out</Typography>
        {
          isTouchDevice ? (
            <PhoneNumberPad value={pNumber} onChange={setPNumber} label={pNumberLabel} />
          ) : (
            <TextField
              label={pNumberLabel}
              fullWidth
              inputMode="numeric"
              onChange={(e) => setPNumber(e.target.value)}
            />
          )
        }
        <LoadingButton
          loading={searching}
          variant="contained"
          color="primary"
          onClick={handleSearch}
        >View Event Shifts</LoadingButton>
      </Stack>

      {/* Full-screen modal for onboarding */}
      <Modal
        open={onboarding.value}
        onClose={onboarding.onFalse}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            bgcolor: 'background.paper',
            overflow: 'auto',
          }}
        >
          <CompactLayout>
            <LasdCompleteProfile
              ignoreUserHook
              returnPath={onboarding.attribute?.path}
              inputUser={onboarding.attribute?.user}
              close={() => onboarding.onFalse()}
            />
          </CompactLayout>
        </Box>
      </Modal>
    </>
  );
}
