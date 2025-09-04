import { useMemo } from "react";
// @mui
import { useTheme, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
// Types
import { Shift } from "src/__generated__/resolvers-types";
import { CHECK_IN_OUT_STATUS } from "src/types/checkinout";
// hooks
import { useFeatures } from "src/hooks/use-features";
import { useBoolean } from "src/hooks/use-boolean";
import { useCheckInOut } from "src/hooks/use-check-in-out";
import { useAuthContext } from "src/auth/hooks";
import { convertDate, useDateFormats } from "src/hooks/use-datejs";
// Components
import Iconify from "src/components/iconify";
import CheckInOutItem from "src/sections/dashboard/dashboard/check-in-out/check-in-out-item";
import CheckInOutConfirm from "./check-in-out-confirm";
import { LoadingScreen } from "../loading-screen";

export default function CheckInOut({
  eventId,
  userId,
  emptyView,
  allowView = true,
  onSuccess,
} : {
  eventId?: string;
  userId?: string;
  emptyView?: JSX.Element;
  allowView?: boolean;
  onSuccess?: (type: CHECK_IN_OUT_STATUS) => void;
}) {
  const { dateTimeFormat } = useDateFormats();
  const { eventCheckIn } = useFeatures();
  const { user } = useAuthContext();
  const theme = useTheme();
  const { currentShifts, loading } = useCheckInOut({
    eventId,
    userId,
  });
  const confirm = useBoolean<Shift>();

  const currentShiftsWithConfig = useMemo(() => currentShifts.map((shift) => {
    const customContent = {
      name: 'Check In',
      icon: <Iconify icon="solar:login-2-bold-duotone" />,
      timeDisplay: convertDate({
        user,
        date: shift.startTime,
      }).format(dateTimeFormat),
    };
    if (shift.shiftCheckInOut?.checkInTime || !eventCheckIn) {
      customContent.name = 'Check Out';
      customContent.icon = <Iconify icon="solar:logout-2-bold-duotone" />;
      customContent.timeDisplay = convertDate({
        user,
        date: shift.endTime,
      }).format(dateTimeFormat)
    }
    return {
      ...shift,
      customContent,
    };
  }), [
    user,
    dateTimeFormat,
    eventCheckIn,
    currentShifts
  ]);

  if (loading) {
    return (
      <LoadingScreen
        sx={{
          borderRadius: 1.5,
          bgcolor: 'background.default',
          mt: 5,
        }}
      />
    );
  }

  if (currentShifts.length === 0 || !allowView) {
    return emptyView || null;
  }

  return (
    <>
      <Box>
        <Typography variant="h4" gutterBottom>
          Shift Check In/Check Out
        </Typography>
      </Box>
      <Box
        gap={3}
        display="grid"
        sx={{ mb: 1, width: '100%' }}
        gridTemplateColumns={{
          xs: 'repeat(1, 1fr)',
          md: 'repeat(2, 1fr)',
        }}
      >
        {
          currentShiftsWithConfig.map((shift) => (
            <Card key={shift.id} sx={{ background: alpha(theme.palette.background.paper, 0.5) }}>
              <CheckInOutItem mapSx={{ mt: 1, height: 200 }} shift={shift} onClick={() => confirm.onTrue(shift)} />
            </Card>
          ))
        }
      </Box>

      <CheckInOutConfirm
        fromKiosk={false}
        confirm={confirm}
        checkInOutConfirm={confirm.attribute as Shift}
        onSuccess={onSuccess}
      />
    </>
  );
}
