import { useEffect } from 'react';
import { m } from 'framer-motion';
// @mui
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
// hooks
import { useAuthContext } from 'src/auth/hooks';
import { useRouter } from 'src/routes/hooks';
// assets
import { ForbiddenIllustration } from 'src/assets/illustrations';
// components
import { MotionContainer, varBounce } from 'src/components/animate';

// ----------------------------------------------------------------------

export default function NotApprovedView() {
  const router = useRouter();
  const { user, logout } = useAuthContext();

  useEffect(() => {
    if (user.superAdmin) {
      router.replace('/');
    }
  }, [user, router]);

  return (
    <MotionContainer>
      <m.div variants={varBounce().in}>
        <Typography variant="h3" sx={{ mb: 2 }}>
          Unauthorized User
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <Typography sx={{ color: 'text.secondary' }}>
          Your account must have super admin privileges in order to access this page.
        </Typography>
      </m.div>

      <m.div variants={varBounce().in}>
        <ForbiddenIllustration sx={{ height: 260, my: { xs: 5, sm: 10 } }} />
      </m.div>

      <Button
        onClick={() => {
          logout();
          router.replace('/');
        }}
        size="large"
        variant="contained"
      >
        Logout
      </Button>
    </MotionContainer>
  );
}
