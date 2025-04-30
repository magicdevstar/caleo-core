import { m } from 'framer-motion';
// @mui
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
// components
import { MotionContainer, varBounce } from 'src/components/animate';
// assets
import { CHECK_IN_OUT_STATUS } from "src/types/checkinout";
import CheckInIllustration from 'src/assets/illustrations/check-in-illustration';
import CheckOutIllustration from 'src/assets/illustrations/check-out-illustration';
import { useMemo } from 'react';

// ----------------------------------------------------------------------

const assetSx = {
  height: 260,
  my: { xs: 2, sm: 2 },
};

export default function CheckInSuccess({
  action,
  status,
}:{
  action: () => void;
  status: CHECK_IN_OUT_STATUS
}) {
  const details = useMemo(() => {
    if (status === CHECK_IN_OUT_STATUS.CHECKED_IN) {
      return {
        title: 'Success!',
        message: 'You have successfully checked in',
        illustration: <CheckInIllustration sx={assetSx} />,
      };
    }
    return {
      title: 'Success!',
      message: 'You have successfully checked out',
      illustration: <CheckOutIllustration sx={assetSx} />,
    };
  }, [status]);
  return (
    <MotionContainer sx={{ textAlign: 'center' }}>
      <m.div variants={varBounce().in}>
        <Typography variant="h3">
          {details.title}
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <Typography sx={{ color: 'text.secondary' }}>
          {details.message}
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        {details.illustration}
      </m.div>

      <Button size="large" variant="contained" onClick={action}>
        Start another check in/out
      </Button>
    </MotionContainer>
  );
}
