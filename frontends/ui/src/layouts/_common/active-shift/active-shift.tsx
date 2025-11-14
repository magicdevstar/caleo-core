import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import IconButton from '@mui/material/IconButton';
import { MemberRole, Shift } from 'src/__generated__/resolvers-types';
import { useAuthContext } from 'src/auth/hooks';
import Iconify from 'src/components/iconify';
import { ShiftOverviewDialog } from 'src/components/shifts/overview/shift-overview-dialog';
import { useBoolean } from 'src/hooks/use-boolean';
import { useCheckInOut } from "src/hooks/use-check-in-out";
import { useFeatures } from "src/hooks/use-features";

export default function ActiveShift() {
  // Using this for now because LASD is the only customer using this feature
  const { lasdEventFields } = useFeatures();
  const { user } = useAuthContext();
  const { currentShifts } = useCheckInOut({ isKiosk: true });
  const controller = useBoolean<Shift>();
  const [firstLoad, setFirstLoad] = useState(false);
  const shift = currentShifts?.[0];

  useEffect(() => {
    if (!!shift && !firstLoad) {
      setFirstLoad(true);
      controller.onTrue(shift);
    }
  }, [shift, firstLoad, controller, setFirstLoad]);

  if (!lasdEventFields || currentShifts?.length === 0) {
    return null;
  }

  return (
    <>
      <IconButton
        component={m.button}
        color="warning"
        onClick={() => controller.onTrue(shift)}
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }}
        aria-label="Active shift overview"
      >
        <Iconify icon="mdi-assignment" width={24} />
      </IconButton>
      <ShiftOverviewDialog controller={controller} isAdminView={user?.member?.role === MemberRole.Admin} closeOnSave />
    </>
  )
}
