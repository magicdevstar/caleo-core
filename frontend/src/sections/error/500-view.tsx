import { m } from 'framer-motion';
// @mui
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
// assets
import { SeverErrorIllustration } from 'src/assets/illustrations';
// components
import { RouterLink } from 'src/routes/components';
import { MotionContainer, varBounce } from 'src/components/animate';

// ----------------------------------------------------------------------

export default function Page500({
  resetErrorBoundary
}: {
  resetErrorBoundary?: any
}) {
  return (
    <MotionContainer sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
    }}>
      <m.div variants={varBounce().in}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Something went wrong!
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <Typography sx={{ color: 'text.secondary' }}>
          We apologize for the inconvenience. We have been notified and are looking into the issue.
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <SeverErrorIllustration sx={{ height: 260, my: { xs: 5, sm: 10 } }} />
      </m.div>

      <Button component={RouterLink} href="/" size="large" variant="contained" onClick={resetErrorBoundary}>
        Go to Home
      </Button>
    </MotionContainer>
  );
}
