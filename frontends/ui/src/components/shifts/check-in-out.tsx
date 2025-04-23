import { useMemo, useState } from "react";
// @mui
import { useTheme, alpha } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
// Types
import { Shift } from "src/__generated__/resolvers-types";
import { CHECK_IN_OUT_STATUS } from "src/types/checkinout";
// hooks
import { useBoolean } from "src/hooks/use-boolean";
import { useCheckInOut } from "src/hooks/use-check-in-out";
import { useAuthContext } from "src/auth/hooks";
import { convertDate, dateTimeFormat } from "src/hooks/use-datejs";
// Components
import Iconify from "src/components/iconify";
import CheckInOutConfirm from "./check-in-out-confirm";
import { LoadingScreen } from "../loading-screen";

export default function CheckInOut({
  eventId,
  userId,
  emptyView,
  onSuccess,
} : {
  eventId?: string;
  userId?: string;
  emptyView?: JSX.Element;
  onSuccess?: (type: CHECK_IN_OUT_STATUS) => void;
}) {
  const { user } = useAuthContext();
  const theme = useTheme();
  const { currentShifts, loading } = useCheckInOut({
    eventId,
    userId,
  });
  const confirm = useBoolean();
  const [checkInOutConfirm, setCheckInOutConfirm] = useState<Shift | null>(null);

  const currentShiftsWithConfig = useMemo(() => currentShifts.map((shift) => {
    const customContent = {
      name: 'Check In',
      icon: <Iconify icon="solar:login-2-bold-duotone" />,
      timeDisplay: convertDate({
        user,
        date: shift.startTime,
      }).format(dateTimeFormat),
    };
    if (shift.shiftCheckInOut?.checkInTime) {
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

  if (currentShifts.length === 0) {
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
              <CardContent>
                <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                  {shift.event.name}
                </Typography>
                <Typography variant="h5" component="div" sx={{ mb: 1, mt: 1 }}>
                  {shift.assignment.name}
                </Typography>
                <Typography sx={{ color: 'text.secondary', mb: 2 }}>{shift.customContent.timeDisplay}</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setCheckInOutConfirm(shift)
                    confirm.onTrue();
                  }}
                  startIcon={shift.customContent.icon}
                >{shift.customContent.name}</Button>
              </CardContent>
            </Card>
          ))
        }
      </Box>

      <CheckInOutConfirm
        confirm={confirm}
        checkInOutConfirm={checkInOutConfirm}
        onSuccess={onSuccess}
      />
    </>
  );
}
